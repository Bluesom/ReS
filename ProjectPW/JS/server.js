const jsonServer = require('json-server')
const express = require('express')
const fs = require('node:fs/promises')
const { randomBytes, randomUUID, scrypt: scryptCallback, timingSafeEqual } = require('node:crypto')
const { promisify } = require('node:util')
const path = require('node:path')
const countries = require('i18n-iso-countries')
const { getCountries, getCountryCallingCode, parsePhoneNumberFromString } = require('libphonenumber-js/max')

countries.registerLocale(require('i18n-iso-countries/langs/en.json'))

const scrypt = promisify(scryptCallback)
const server = jsonServer.create()
const databasePath = process.env.DATABASE_PATH
    ? path.resolve(process.env.DATABASE_PATH)
    : path.join(__dirname, '..', 'database', 'db.json')
const router = jsonServer.router(databasePath)
const middlewares = jsonServer.defaults()
const port = Number(process.env.PORT) || 3000
const countryOptions = getCountries()
    .map((code) => ({
        code,
        name: countries.getName(code, 'en'),
        dialCode: getCountryCallingCode(code),
    }))
    .filter((country) => country.name)
    .sort((a, b) => a.name.localeCompare(b.name))
const countryCodes = new Set(countryOptions.map((country) => country.code))
const authSessions = new Map()
const SESSION_DURATION_MS = 2 * 60 * 60 * 1000

const getSession = (request) => {
    const token = request.get('Authorization')?.replace(/^Bearer\s+/i, '')
    const session = token && authSessions.get(token)
    if (!session || session.expiresAt <= Date.now()) {
        if (token) authSessions.delete(token)
        return null
    }
    return { ...session, token }
}

const getGuestProfile = (guest) => {
    const roomTypes = new Map(router.db.get('roomTypes').value().map((roomType) => [roomType.id, roomType]))
    const bookings = router.db.get('bookings')
        .filter({ guestId: guest.id })
        .value()
        .map((booking) => {
            const roomType = roomTypes.get(booking.roomTypeId)
            if (!roomType) {
                throw new Error(`Booking ${booking.id} has an invalid room type reference.`)
            }
            return {
                id: booking.id,
                roomType: roomType.name,
                checkIn: booking.checkIn,
                checkOut: booking.checkOut,
                guests: booking.guests,
                status: booking.status,
            }
        })
        .sort((a, b) => String(b.checkIn).localeCompare(String(a.checkIn)))

    return {
        guest: {
            id: guest.id,
            guestNumber: guest.guestNumber,
            name: guest.name,
            email: guest.email,
            phone: guest.phone,
            country: guest.country,
            createdAt: guest.createdAt || null,
        },
        bookings,
    }
}

const hashPassword = async (password, salt = randomBytes(16)) => ({
    salt: salt.toString('hex'),
    passwordHash: (await scrypt(password, salt, 64)).toString('hex'),
})

const nextGuestNumber = () => {
    const guestNumbers = router.db.get('guests').map('guestNumber').value()
    const existingMaximum = guestNumbers.reduce((highest, guestNumber) => {
        const match = /^G-(\d+)$/.exec(guestNumber || '')
        return match ? Math.max(highest, Number(match[1])) : highest
    }, 0)
    const savedSequence = router.db.get('sequences.guestNumber').value() || 0
    const sequence = Math.max(savedSequence, existingMaximum) + 1

    return {
        guestNumber: `G-${String(sequence).padStart(3, '0')}`,
        sequence,
    }
}

server.use(middlewares)
server.use('/Assets', express.static(path.join(__dirname, '..', 'Assets')))
server.use(jsonServer.bodyParser)

server.get('/metadata/countries', (request, response) => {
    response.json(countryOptions)
})

server.get('/metadata/room-types', (request, response) => {
    response.json(router.db.get('roomTypes').value().map(({ id, name, ratePerNight, description, imagePath, capacity, bedType, smokingAllowed, sofa, amenities, mealPlan }) => ({
        id,
        name,
        ratePerNight,
        description: description || '',
        imagePath: imagePath || '',
        capacity: capacity || 2,
        bedType: bedType || 'Queen',
        smokingAllowed: smokingAllowed === true,
        sofa: sofa === true,
        amenities: Array.isArray(amenities) ? amenities : [],
        mealPlan: mealPlan || 'No meals',
    })))
})

server.get('/offers', (request, response) => {
    if (request.query.admin === 'true') {
        const session = getSession(request)
        if (session?.role !== 'admin') {
            response.sendStatus(401)
            return
        }
        response.json(router.db.get('offers').value())
        return
    }
    const today = new Date().toISOString().slice(0, 10)
    const activeOffers = router.db.get('offers').value().filter((offer) =>
        offer.active === true && offer.startDate <= today && offer.endDate >= today
    )
    response.json(activeOffers)
})

server.post('/auth/login', async (request, response, next) => {
    try {
        const body = request.body && typeof request.body === 'object' ? request.body : {}
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
        const password = typeof body.password === 'string' ? body.password : ''
        const admin = router.db.get('admins').find((item) =>
            typeof item.email === 'string' && item.email.toLowerCase() === email
        ).value()
        const guest = router.db.get('guests').find((item) =>
            item.active !== false && typeof item.email === 'string' && item.email.toLowerCase() === email
        ).value()
        const account = admin ? { ...admin, role: 'admin' } : guest ? { ...guest, role: 'guest' } : null
        const credentialsCollection = admin ? 'adminCredentials' : 'guestCredentials'
        const credential = account && router.db.get(credentialsCollection).find({ id: account.id }).value()

        if (!account || !credential || !password) {
            response.status(401).json({ error: 'Email or password is incorrect.' })
            return
        }

        const salt = Buffer.from(credential.salt, 'hex')
        const storedHash = Buffer.from(credential.passwordHash, 'hex')
        const submittedHash = await scrypt(password, salt, storedHash.length)

        if (!timingSafeEqual(storedHash, submittedHash)) {
            response.status(401).json({ error: 'Email or password is incorrect.' })
            return
        }

        const token = randomBytes(32).toString('hex')
        authSessions.set(token, {
            accountId: account.id,
            role: account.role,
            expiresAt: Date.now() + SESSION_DURATION_MS,
        })
        const { id, adminNumber, guestNumber, name } = account
        response.json({ token, role: account.role, account: { id, adminNumber, guestNumber, name, email: account.email } })
    } catch (error) {
        next(error)
    }
})

server.get('/auth/admin-session', (request, response) => {
    const session = getSession(request)
    const admin = session?.role === 'admin' && router.db.get('admins').find({ id: session.accountId }).value()
    if (!admin) {
        response.sendStatus(401)
        return
    }
    response.json({ id: admin.id, adminNumber: admin.adminNumber, name: admin.name, email: admin.email })
})

server.get('/auth/guest-session', (request, response) => {
    const session = getSession(request)
    const guest = session?.role === 'guest' && router.db.get('guests').find({ id: session.accountId }).value()
    if (!guest) {
        response.sendStatus(401)
        return
    }
    response.json({
        id: guest.id,
        guestNumber: guest.guestNumber,
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        country: guest.country,
    })
})

server.get('/auth/guest-profile', (request, response, next) => {
    try {
        const session = getSession(request)
        const guest = session?.role === 'guest' && router.db.get('guests').find({ id: session.accountId }).value()
        if (!guest) {
            response.sendStatus(401)
            return
        }
        response.json(getGuestProfile(guest))
    } catch (error) {
        next(error)
    }
})

server.patch('/auth/guest-profile', (request, response, next) => {
    try {
        const session = getSession(request)
        const guest = session?.role === 'guest' && router.db.get('guests').find({ id: session.accountId }).value()
        if (!guest) {
            response.sendStatus(401)
            return
        }

        const body = request.body && typeof request.body === 'object' ? request.body : {}
        const name = typeof body.name === 'string' ? body.name.trim() : ''
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
        const countryCode = typeof body.countryCode === 'string' ? body.countryCode.toUpperCase() : ''
        const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
        const country = countries.getName(countryCode, 'en')
        const phoneNumber = parsePhoneNumberFromString(phone)

        if (!name || name.length > 100) {
            response.status(400).json({ error: 'Name is required and must be 100 characters or fewer.' })
            return
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
            response.status(400).json({ error: 'Enter a valid email address.' })
            return
        }
        if (router.db.get('guests').value().some((item) => item.id !== guest.id && item.email.toLowerCase() === email)
            || router.db.get('admins').value().some((item) => item.email.toLowerCase() === email)) {
            response.status(409).json({ error: 'An account with this email already exists.' })
            return
        }
        if (!countryCodes.has(countryCode) || !country) {
            response.status(400).json({ error: 'Choose a valid country.' })
            return
        }
        if (!phoneNumber || !phoneNumber.isValid()) {
            response.status(400).json({ error: 'Enter a valid international phone number.' })
            return
        }

        const updatedGuest = {
            ...guest,
            name,
            email,
            country,
            phone: phoneNumber.number,
        }
        router.db.set('guests', router.db.get('guests').value().map((item) =>
            item.id === guest.id ? updatedGuest : item
        )).write()

        response.json(getGuestProfile(updatedGuest))
    } catch (error) {
        next(error)
    }
})

server.post('/auth/admin-logout', (request, response) => {
    const session = getSession(request)
    if (session) authSessions.delete(session.token)
    response.sendStatus(204)
})

server.post('/auth/logout', (request, response) => {
    const session = getSession(request)
    if (session?.role !== 'guest') {
        response.sendStatus(401)
        return
    }
    authSessions.delete(session.token)
    response.sendStatus(204)
})

server.post('/auth/guest-bookings', (request, response, next) => {
    try {
        const session = getSession(request)
        const guest = session?.role === 'guest' && router.db.get('guests').find({ id: session.accountId }).value()
        if (!guest) {
            response.sendStatus(401)
            return
        }

        const body = request.body && typeof request.body === 'object' ? request.body : {}
        const checkIn = typeof body.checkIn === 'string' ? body.checkIn : ''
        const checkOut = typeof body.checkOut === 'string' ? body.checkOut : ''
        const guests = body.guests
        const roomTypeId = typeof body.roomTypeId === 'string' ? body.roomTypeId : ''
        const datePattern = /^\d{4}-\d{2}-\d{2}$/
        const parseDate = (value) => {
            if (!datePattern.test(value)) return null
            const date = new Date(`${value}T00:00:00.000Z`)
            return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date
        }
        const checkInDate = parseDate(checkIn)
        const checkOutDate = parseDate(checkOut)
        const today = new Date()
        today.setUTCHours(0, 0, 0, 0)
        const roomType = router.db.get('roomTypes').find({ id: roomTypeId }).value()

        if (!checkInDate || !checkOutDate || checkInDate < today || checkOutDate <= checkInDate) {
            response.status(400).json({ error: 'Choose valid stay dates, with departure after arrival and arrival no earlier than today.' })
            return
        }
        if (!Number.isInteger(guests) || guests < 1 || guests > 20) {
            response.status(400).json({ error: 'Guest count must be a whole number from 1 to 20.' })
            return
        }
        if (!roomType || !Number.isFinite(roomType.ratePerNight) || roomType.ratePerNight < 0) {
            response.status(400).json({ error: 'Choose a valid room type.' })
            return
        }
        const roomCapacity = Number(roomType.capacity) || 2
        if (guests > roomCapacity) {
            response.status(400).json({ error: `This room type accommodates up to ${roomCapacity} guests.` })
            return
        }

        const nights = (checkOutDate.getTime() - checkInDate.getTime()) / 86400000
        const baseAmount = nights * roomType.ratePerNight
        const booking = {
            id: `B-${randomUUID()}`,
            guestId: guest.id,
            roomTypeId: roomType.id,
            checkIn,
            checkOut,
            guests,
            status: 'pending',
            totalAmount: baseAmount,
            baseAmount,
            roomId: null,
            appliedOffer: null,
            offerDiscountAmount: 0,
            requests: '',
            createdAt: new Date().toISOString(),
        }
        router.db.set('bookings', [...router.db.get('bookings').value(), booking]).write()
        response.status(201).json({
            booking: {
                id: booking.id,
                checkIn: booking.checkIn,
                checkOut: booking.checkOut,
                guests: booking.guests,
                status: booking.status,
                totalAmount: booking.totalAmount,
                roomType: roomType.name,
            },
            message: 'Your availability request has been saved as a pending booking.',
        })
    } catch (error) {
        next(error)
    }
})

server.post('/auth/reset-password', async (request, response, next) => {
    try {
        const body = request.body && typeof request.body === 'object' ? request.body : {}
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
        const password = typeof body.password === 'string' ? body.password : ''
        const confirmPassword = typeof body.confirmPassword === 'string' ? body.confirmPassword : ''
        const admin = router.db.get('admins').find((item) =>
            typeof item.email === 'string' && item.email.toLowerCase() === email
        ).value()
        const guest = router.db.get('guests').find((item) =>
            item.active !== false && typeof item.email === 'string' && item.email.toLowerCase() === email
        ).value()
        const account = admin || guest

        if (!account) {
            response.status(404).json({ error: 'No account was found with that email address.' })
            return
        }
        if (password.length < 8 || !/\d/.test(password) || Buffer.byteLength(password, 'utf8') > 128) {
            response.status(400).json({ error: 'Password must be at least 8 characters, include a number, and be no more than 128 bytes.' })
            return
        }
        if (password !== confirmPassword) {
            response.status(400).json({ error: 'Passwords do not match.' })
            return
        }

        const collection = admin ? 'adminCredentials' : 'guestCredentials'
        const credentials = router.db.get(collection).value()
        if (!credentials.some((credential) => credential.id === account.id)) {
            response.status(404).json({ error: 'No password credential exists for that account.' })
            return
        }
        const nextCredential = { id: account.id, ...(await hashPassword(password)) }
        router.db.set(collection, credentials.map((credential) =>
            credential.id === account.id ? nextCredential : credential
        )).write()

        for (const [token, session] of authSessions) {
            if (session.accountId === account.id) authSessions.delete(token)
        }

        response.json({ message: 'Password updated. You can now sign in.' })
    } catch (error) {
        next(error)
    }
})

server.patch('/bookings/:id', (request, response) => {
    const session = getSession(request)
    if (session?.role !== 'admin') {
        response.status(401).json({ error: 'An administrator must log in to update bookings.' })
        return
    }

    const allowedStatuses = new Set(['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'])
    const bookings = router.db.get('bookings').value()
    const booking = bookings.find((item) => item.id === request.params.id)
    if (!booking) {
        response.status(404).json({ error: 'Booking not found.' })
        return
    }

    const body = request.body && typeof request.body === 'object' ? request.body : {}
    const status = body.status === undefined ? booking.status : body.status
    const roomId = Object.prototype.hasOwnProperty.call(body, 'roomId') ? body.roomId : booking.roomId || null
    if (!allowedStatuses.has(status)) {
        response.status(400).json({ error: 'Choose a valid booking status.' })
        return
    }

    if (roomId !== null && typeof roomId !== 'string') {
        response.status(400).json({ error: 'Choose a valid physical room.' })
        return
    }

    if (roomId) {
        const room = router.db.get('rooms').find({ id: roomId }).value()
        if (!room || room.roomTypeId !== booking.roomTypeId) {
            response.status(400).json({ error: 'The assigned room must be a physical room of the requested room type.' })
            return
        }
        if (room.status === 'maintenance' && !['pending', 'cancelled', 'checked-out'].includes(status)) {
            response.status(400).json({ error: 'A room under maintenance cannot be assigned to an active stay.' })
            return
        }
        const hasConflict = bookings.some((other) =>
            other.id !== booking.id &&
            other.roomId === roomId &&
            ['confirmed', 'checked-in'].includes(other.status) &&
            status !== 'pending' &&
            status !== 'cancelled' &&
            status !== 'checked-out' &&
            booking.checkIn < other.checkOut &&
            other.checkIn < booking.checkOut
        )
        if (hasConflict) {
            response.status(409).json({ error: 'This room is already assigned to an overlapping confirmed stay.' })
            return
        }
    }

    if (['confirmed', 'checked-in'].includes(status) && !roomId) {
        response.status(400).json({ error: 'Assign a physical room before confirming or checking a guest in.' })
        return
    }

    let appliedOffer = Object.prototype.hasOwnProperty.call(body, 'offerId')
        ? null
        : booking.appliedOffer || null
    if (body.offerId) {
        const offer = router.db.get('offers').find({ id: body.offerId }).value()
        const existingSnapshot = booking.appliedOffer?.id === body.offerId ? booking.appliedOffer : null
        if (!offer && !existingSnapshot) {
            response.status(400).json({ error: 'Choose an active offer that covers the entire stay, or select no offer.' })
            return
        }
        if (offer && (offer.active !== true || offer.startDate > booking.checkIn || offer.endDate < booking.checkOut)) {
            response.status(400).json({ error: 'Choose an active offer that covers the entire stay, or select no offer.' })
            return
        }
        appliedOffer = existingSnapshot || {
            id: offer.id,
            title: offer.title,
            discountType: offer.discountType,
            discountValue: offer.discountValue,
        }
    }
    const baseAmount = Number.isFinite(Number(booking.baseAmount))
        ? Number(booking.baseAmount)
        : Number(booking.totalAmount) || 0
    const offerDiscountAmount = !appliedOffer
        ? 0
        : appliedOffer.discountType === 'percentage'
            ? baseAmount * Number(appliedOffer.discountValue) / 100
            : Math.min(baseAmount, Number(appliedOffer.discountValue))

    const updatedBooking = router.db.get('bookings')
        .find({ id: request.params.id })
        .assign({
            status,
            roomId,
            appliedOffer,
            baseAmount,
            offerDiscountAmount,
            totalAmount: Math.max(0, baseAmount - offerDiscountAmount),
        })
        .write()
    response.json(updatedBooking)
})

server.use((request, response, next) => {
    if (/^\/(?:guest|admin)Credentials(?:\/|$)/i.test(request.path)) {
        response.sendStatus(404)
        return
    }
    next()
})

server.use((request, response, next) => {
    if (request.path.startsWith('/auth/') || request.path.startsWith('/metadata/')) {
        next()
        return
    }
    const session = getSession(request)
    if (session?.role !== 'admin') {
        response.status(401).json({ error: 'An administrator must log in to access this data.' })
        return
    }
    next()
})

class OfferValidationError extends Error {}

const validateOffer = (body) => {
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const description = typeof body.description === 'string' ? body.description.trim() : ''
    const discountValue = Number(body.discountValue)
    const discountType = body.discountType
    const startDate = typeof body.startDate === 'string' ? body.startDate : ''
    const endDate = typeof body.endDate === 'string' ? body.endDate : ''
    const active = body.active === true
    const imagePath = typeof body.imagePath === 'string' ? body.imagePath.trim() : ''
    const isIsoDate = (value) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
        const date = new Date(`${value}T00:00:00.000Z`)
        return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    }

    if (!title || title.length > 100) throw new OfferValidationError('Offer title is required and must be 100 characters or fewer.')
    if (!description || description.length > 500) throw new OfferValidationError('Offer description is required and must be 500 characters or fewer.')
    if (!['percentage', 'fixed'].includes(discountType)) throw new OfferValidationError('Choose a valid discount type.')
    if (!Number.isFinite(discountValue) || discountValue <= 0 || (discountType === 'percentage' && discountValue > 100)) {
        throw new OfferValidationError(discountType === 'percentage'
            ? 'Percentage discount must be between 1 and 100.'
            : 'Fixed discount must be greater than 0.')
    }
    if (!isIsoDate(startDate) || !isIsoDate(endDate) || endDate < startDate) {
        throw new OfferValidationError('Enter valid offer dates, with the end date on or after the start date.')
    }
    if (imagePath && (!imagePath.startsWith('./Assets/') || imagePath.includes('..') || /["'<>\s]/.test(imagePath))) {
        throw new OfferValidationError('Offer image must be a local path inside the Assets folder, such as ./Assets/offer.jpg.')
    }

    return { title, description, discountType, discountValue, startDate, endDate, active, imagePath }
}

server.post('/offers', (request, response, next) => {
    try {
        const offer = { id: `O-${randomUUID()}`, ...validateOffer(request.body || {}) }
        router.db.set('offers', [...router.db.get('offers').value(), offer]).write()
        response.status(201).json(offer)
    } catch (error) {
        if (error instanceof OfferValidationError) {
            response.status(400).json({ error: error.message })
            return
        }
        next(error)
    }
})

server.patch('/offers/:id', (request, response, next) => {
    try {
        if (!router.db.get('offers').value().some((offer) => offer.id === request.params.id)) {
            response.status(404).json({ error: 'Offer not found.' })
            return
        }
        const updatedOffer = {
            id: request.params.id,
            ...validateOffer(request.body || {}),
        }
        router.db.set('offers', router.db.get('offers').value().map((offer) =>
            offer.id === request.params.id ? updatedOffer : offer
        )).write()
        response.json(updatedOffer)
    } catch (error) {
        if (error instanceof OfferValidationError) {
            response.status(400).json({ error: error.message })
            return
        }
        next(error)
    }
})

server.delete('/offers/:id', (request, response) => {
    const offers = router.db.get('offers').value()
    if (!offers.some((offer) => offer.id === request.params.id)) {
        response.status(404).json({ error: 'Offer not found.' })
        return
    }
    router.db.set('offers', offers.filter((offer) => offer.id !== request.params.id)).write()
    response.sendStatus(204)
})

class RoomTypeValidationError extends Error {}
class RoomValidationError extends Error {}
class GuestValidationError extends Error {}

server.post('/uploads/image', async (request, response, next) => {
    try {
        const imageTypes = {
            'image/jpeg': { extension: 'jpg', matches: (buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff },
            'image/png': { extension: 'png', matches: (buffer) => buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
            'image/webp': { extension: 'webp', matches: (buffer) => buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP' },
        }
        const imageType = imageTypes[request.get('Content-Type')?.split(';')[0].toLowerCase()]
        if (!imageType) {
            response.status(400).json({ error: 'Choose a JPEG, PNG, or WebP image.' })
            return
        }

        const maximumBytes = 5 * 1024 * 1024
        const contentLength = Number(request.get('Content-Length'))
        if (Number.isFinite(contentLength) && contentLength > maximumBytes) {
            response.status(413).json({ error: 'Room photos must be 5 MB or smaller.' })
            request.resume()
            return
        }

        const chunks = []
        let totalBytes = 0
        for await (const chunk of request) {
            totalBytes += chunk.length
            if (totalBytes > maximumBytes) {
                response.status(413).json({ error: 'Room photos must be 5 MB or smaller.' })
                return
            }
            chunks.push(chunk)
        }
        const image = Buffer.concat(chunks)
        if (!imageType.matches(image)) {
            response.status(400).json({ error: 'The selected file does not match its image format.' })
            return
        }

        const fileName = `room-${randomUUID()}.${imageType.extension}`
        const assetsDirectory = path.join(__dirname, '..', 'Assets')
        await fs.mkdir(assetsDirectory, { recursive: true })
        await fs.writeFile(path.join(assetsDirectory, fileName), image, { flag: 'wx' })
        response.status(201).json({ imagePath: `./Assets/${fileName}` })
    } catch (error) {
        next(error)
    }
})

const validateImagePath = (imagePath, label) => {
    if (imagePath && (!imagePath.startsWith('./Assets/') || imagePath.includes('..') || /["'<>\u0000-\u001f\\]/.test(imagePath))) {
        throw new Error(`${label} must be a local path inside the Assets folder, such as ./Assets/photo.jpg.`)
    }
}

const validateRoomType = (body) => {
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const description = typeof body.description === 'string' ? body.description.trim() : ''
    const ratePerNight = Number(body.ratePerNight)
    const capacity = Number(body.capacity)
    const imagePath = typeof body.imagePath === 'string' ? body.imagePath.trim() : ''
    const bedType = typeof body.bedType === 'string' ? body.bedType : 'Queen'
    const smokingAllowed = body.smokingAllowed === true
    const sofa = body.sofa === true
    const mealPlan = body.mealPlan === undefined ? 'No meals' : body.mealPlan
    const allowedMealPlans = new Set(['No meals', 'Breakfast', 'Breakfast and dinner'])
    const allowedAmenities = new Set(['Wi-Fi', 'Balcony', 'Lake view', 'Mini bar', 'Air conditioning'])
    const amenities = Array.isArray(body.amenities) ? [...new Set(body.amenities)] : []
    if (!name || name.length > 80) throw new RoomTypeValidationError('Room type name is required and must be 80 characters or fewer.')
    if (description.length > 1000) throw new RoomTypeValidationError('Room description must be 1,000 characters or fewer.')
    if (!Number.isFinite(ratePerNight) || ratePerNight < 0) throw new RoomTypeValidationError('Nightly rate must be zero or greater.')
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 20) throw new RoomTypeValidationError('Room capacity must be a whole number from 1 to 20.')
    if (!['King', 'Queen', 'Double', 'Twin', 'Single'].includes(bedType)) throw new RoomTypeValidationError('Choose a valid bed type.')
    if (typeof body.smokingAllowed !== 'boolean' || typeof body.sofa !== 'boolean') {
        throw new RoomTypeValidationError('Choose whether smoking is allowed and whether the room has a sofa.')
    }
    if (typeof mealPlan !== 'string' || !allowedMealPlans.has(mealPlan)) {
        throw new RoomTypeValidationError('Choose a valid room meal plan.')
    }
    if (amenities.some((amenity) => typeof amenity !== 'string' || !allowedAmenities.has(amenity))) {
        throw new RoomTypeValidationError('Choose amenities from the available list.')
    }
    try {
        validateImagePath(imagePath, 'Room image')
    } catch (error) {
        throw new RoomTypeValidationError(error.message)
    }
    return { name, description, ratePerNight, capacity, imagePath, bedType, smokingAllowed, sofa, amenities, mealPlan }
}

const validateRoom = (body, roomId = null) => {
    const roomNumber = typeof body.roomNumber === 'string' ? body.roomNumber.trim() : ''
    const roomTypeId = typeof body.roomTypeId === 'string' ? body.roomTypeId : ''
    const floor = Number(body.floor)
    const status = body.status
    if (!/^[A-Za-z0-9-]{1,12}$/.test(roomNumber)) throw new RoomValidationError('Room number must contain 1 to 12 letters, numbers, or hyphens.')
    if (!router.db.get('roomTypes').find({ id: roomTypeId }).value()) throw new RoomValidationError('Choose an existing room type.')
    if (!Number.isInteger(floor) || floor < 0 || floor > 100) throw new RoomValidationError('Floor must be a whole number from 0 to 100.')
    if (!['available', 'maintenance'].includes(status)) throw new RoomValidationError('Choose available or maintenance as the housekeeping status.')
    const duplicate = router.db.get('rooms').value().some((room) =>
        room.id !== roomId && String(room.roomNumber).toLowerCase() === roomNumber.toLowerCase()
    )
    if (duplicate) throw new RoomValidationError('That room number is already in use.')
    return { roomNumber, roomTypeId, floor, status }
}

const respondValidationError = (error, response, next) => {
    if (error instanceof RoomTypeValidationError || error instanceof RoomValidationError || error instanceof GuestValidationError) {
        response.status(400).json({ error: error.message })
        return
    }
    next(error)
}

server.post('/roomTypes', (request, response, next) => {
    try {
        const roomType = { id: `RT-${randomUUID()}`, ...validateRoomType(request.body || {}) }
        router.db.set('roomTypes', [...router.db.get('roomTypes').value(), roomType]).write()
        response.status(201).json(roomType)
    } catch (error) {
        respondValidationError(error, response, next)
    }
})

server.patch('/roomTypes/:id', (request, response, next) => {
    try {
        if (!router.db.get('roomTypes').value().some((roomType) => roomType.id === request.params.id)) {
            response.status(404).json({ error: 'Room type not found.' })
            return
        }
        const updated = { id: request.params.id, ...validateRoomType(request.body || {}) }
        router.db.set('roomTypes', router.db.get('roomTypes').value().map((roomType) =>
            roomType.id === updated.id ? updated : roomType
        )).write()
        response.json(updated)
    } catch (error) {
        respondValidationError(error, response, next)
    }
})

server.delete('/roomTypes/:id', (request, response) => {
    const roomTypes = router.db.get('roomTypes').value()
    if (!roomTypes.some((roomType) => roomType.id === request.params.id)) {
        response.status(404).json({ error: 'Room type not found.' })
        return
    }
    const isReferenced = router.db.get('rooms').value().some((room) => room.roomTypeId === request.params.id) ||
        router.db.get('bookings').value().some((booking) => booking.roomTypeId === request.params.id)
    if (isReferenced) {
        response.status(409).json({ error: 'This room type is used by a room or booking. Remove its physical rooms and retain the type for booking history.' })
        return
    }
    router.db.set('roomTypes', roomTypes.filter((roomType) => roomType.id !== request.params.id)).write()
    response.sendStatus(204)
})

server.post('/rooms', (request, response, next) => {
    try {
        const room = { id: `R-${randomUUID()}`, ...validateRoom(request.body || {}) }
        router.db.set('rooms', [...router.db.get('rooms').value(), room]).write()
        response.status(201).json(room)
    } catch (error) {
        respondValidationError(error, response, next)
    }
})

server.patch('/rooms/:id', (request, response, next) => {
    try {
        const room = router.db.get('rooms').find({ id: request.params.id }).value()
        if (!room) {
            response.status(404).json({ error: 'Room not found.' })
            return
        }
        const updated = { id: room.id, ...validateRoom(request.body || {}, room.id) }
        const roomBookings = router.db.get('bookings').value().filter((booking) => booking.roomId === room.id)
        if (roomBookings.some((booking) => booking.roomTypeId !== updated.roomTypeId)) {
            response.status(409).json({ error: 'A room with booking history cannot change room type.' })
            return
        }
        if (updated.status === 'maintenance' && roomBookings.some((booking) =>
            ['confirmed', 'checked-in'].includes(booking.status) && booking.checkOut >= new Date().toISOString().slice(0, 10)
        )) {
            response.status(409).json({ error: 'This room has an upcoming or active stay. Reassign or cancel it before marking the room under maintenance.' })
            return
        }
        router.db.set('rooms', router.db.get('rooms').value().map((item) =>
            item.id === updated.id ? updated : item
        )).write()
        response.json(updated)
    } catch (error) {
        respondValidationError(error, response, next)
    }
})

server.delete('/rooms/:id', (request, response) => {
    const rooms = router.db.get('rooms').value()
    if (!rooms.some((room) => room.id === request.params.id)) {
        response.status(404).json({ error: 'Room not found.' })
        return
    }
    if (router.db.get('bookings').value().some((booking) => booking.roomId === request.params.id)) {
        response.status(409).json({ error: 'This room is referenced by booking history and cannot be deleted.' })
        return
    }
    router.db.set('rooms', rooms.filter((room) => room.id !== request.params.id)).write()
    response.sendStatus(204)
})

server.post('/guests', async (request, response, next) => {
    try {
        const body = request.body && typeof request.body === 'object' ? request.body : {}
        const name = typeof body.name === 'string' ? body.name.trim() : ''
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
        const country = typeof body.country === 'string' ? body.country.trim() : ''
        const rawPhone = typeof body.phone === 'string' ? body.phone.trim() : ''
        const password = typeof body.password === 'string' ? body.password : ''
        const phone = parsePhoneNumberFromString(rawPhone)
        if (!name || name.length > 100) throw new GuestValidationError('Guest name is required and must be 100 characters or fewer.')
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new GuestValidationError('Enter a valid email address.')
        if (!country || country.length > 80) throw new GuestValidationError('Country is required and must be 80 characters or fewer.')
        if (!phone?.isValid()) throw new GuestValidationError('Enter a valid international phone number, including its country code.')
        if (password.length < 8 || !/\d/.test(password) || Buffer.byteLength(password, 'utf8') > 128) {
            throw new GuestValidationError('Temporary password must be at least 8 characters, include a number, and be no more than 128 bytes.')
        }
        const existingGuest = router.db.get('guests').value().some((guest) => guest.email?.toLowerCase() === email)
        const existingAdmin = router.db.get('admins').value().some((admin) => admin.email?.toLowerCase() === email)
        if (existingGuest || existingAdmin) {
            response.status(409).json({ error: 'An account with this email already exists.' })
            return
        }
        const id = `G-${randomUUID()}`
        const { guestNumber, sequence } = nextGuestNumber()
        const guest = {
            id,
            guestNumber,
            name,
            email,
            country,
            phone: phone.number,
            active: true,
            createdAt: new Date().toISOString(),
            totalBookings: 0,
            lastStay: null,
        }
        const credential = { id, ...(await hashPassword(password)) }
        router.db
            .set('sequences.guestNumber', sequence)
            .set('guests', [...router.db.get('guests').value(), guest])
            .set('guestCredentials', [...router.db.get('guestCredentials').value(), credential])
            .write()
        response.status(201).json(guest)
    } catch (error) {
        respondValidationError(error, response, next)
    }
})

server.patch('/guests/:id', (request, response, next) => {
    try {
        const guest = router.db.get('guests').find({ id: request.params.id }).value()
        if (!guest) {
            response.status(404).json({ error: 'Guest not found.' })
            return
        }
        const body = request.body && typeof request.body === 'object' ? request.body : {}
        const update = {}
        if (Object.prototype.hasOwnProperty.call(body, 'name')) {
            const name = typeof body.name === 'string' ? body.name.trim() : ''
            if (!name || name.length > 100) throw new GuestValidationError('Guest name is required and must be 100 characters or fewer.')
            update.name = name
        }
        if (Object.prototype.hasOwnProperty.call(body, 'email')) {
            const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new GuestValidationError('Enter a valid email address.')
            const duplicateGuest = router.db.get('guests').value().some((item) => item.id !== guest.id && item.email?.toLowerCase() === email)
            const duplicateAdmin = router.db.get('admins').value().some((item) => item.email?.toLowerCase() === email)
            if (duplicateGuest || duplicateAdmin) {
                response.status(409).json({ error: 'An account with this email already exists.' })
                return
            }
            update.email = email
        }
        if (Object.prototype.hasOwnProperty.call(body, 'phone')) {
            const phone = typeof body.phone === 'string' ? parsePhoneNumberFromString(body.phone.trim()) : null
            if (!phone?.isValid()) throw new GuestValidationError('Enter a valid international phone number, including its country code.')
            update.phone = phone.number
        }
        if (Object.prototype.hasOwnProperty.call(body, 'country')) {
            const country = typeof body.country === 'string' ? body.country.trim() : ''
            if (!country || country.length > 80) throw new GuestValidationError('Country is required and must be 80 characters or fewer.')
            update.country = country
        }
        if (Object.prototype.hasOwnProperty.call(body, 'active')) {
            if (typeof body.active !== 'boolean') throw new GuestValidationError('Account active state must be true or false.')
            update.active = body.active
        }
        if (update.active === false) {
            for (const [token, session] of authSessions) {
                if (session.accountId === guest.id) authSessions.delete(token)
            }
        }
        const updated = router.db.get('guests').find({ id: guest.id }).assign(update).write()
        response.json(updated)
    } catch (error) {
        respondValidationError(error, response, next)
    }
})

server.delete('/guests/:id', (request, response) => {
    const guest = router.db.get('guests').find({ id: request.params.id }).value()
    if (!guest) {
        response.status(404).json({ error: 'Guest not found.' })
        return
    }
    for (const [token, session] of authSessions) {
        if (session.accountId === guest.id) authSessions.delete(token)
    }
    const updated = router.db.get('guests').find({ id: guest.id }).assign({ active: false }).write()
    response.json(updated)
})

server.post('/auth/register', async (request, response, next) => {
    try {
        const body = request.body && typeof request.body === 'object' ? request.body : {}
        const name = typeof body.name === 'string' ? body.name.trim() : ''
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
        const password = typeof body.password === 'string' ? body.password : ''
        const confirmPassword = typeof body.confirmPassword === 'string' ? body.confirmPassword : ''
        const countryCode = typeof body.countryCode === 'string' ? body.countryCode.toUpperCase() : ''
        const phoneCountryCode = typeof body.phoneCountryCode === 'string' ? body.phoneCountryCode.toUpperCase() : ''
        const phone = typeof body.phone === 'string' ? body.phone : ''

        if (!name || name.length > 100) {
            response.status(400).json({ error: 'Name is required and must be 100 characters or fewer.' })
            return
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
            response.status(400).json({ error: 'Enter a valid email address.' })
            return
        }

        if (!countryCodes.has(countryCode)) {
            response.status(400).json({ error: 'Choose a valid country.' })
            return
        }

        if (!countryCodes.has(phoneCountryCode)) {
            response.status(400).json({ error: 'Choose a valid phone country code.' })
            return
        }

        if (!/^\d{4,14}$/.test(phone)) {
            response.status(400).json({ error: 'Phone number must contain 4 to 14 digits.' })
            return
        }

        const phoneNumber = parsePhoneNumberFromString(phone, phoneCountryCode)
        if (!phoneNumber || !phoneNumber.isValid()) {
            response.status(400).json({ error: 'Enter a valid phone number for the selected country code.' })
            return
        }

        if (password.length < 8 || !/\d/.test(password) || Buffer.byteLength(password, 'utf8') > 128) {
            response.status(400).json({ error: 'Password must be at least 8 characters, include a number, and be no more than 128 bytes.' })
            return
        }

        if (password !== confirmPassword) {
            response.status(400).json({ error: 'Passwords do not match.' })
            return
        }

        const guests = router.db.get('guests').value()
        if (guests.some((guest) => typeof guest.email === 'string' && guest.email.toLowerCase() === email)) {
            response.status(409).json({ error: 'An account with this email already exists.' })
            return
        }

        const existingAdmin = router.db.get('admins').find((admin) =>
            typeof admin.email === 'string' && admin.email.toLowerCase() === email
        ).value()
        if (existingAdmin) {
            response.status(409).json({ error: 'An account with this email already exists.' })
            return
        }

        const credential = { id: `G-${randomUUID()}`, ...(await hashPassword(password)) }
        const guestId = credential.id
        const { guestNumber, sequence } = nextGuestNumber()
        const guest = {
            id: guestId,
            guestNumber,
            name,
            email,
            createdAt: new Date().toISOString(),
            country: countries.getName(countryCode, 'en'),
            phone: phoneNumber.number,
            totalBookings: 0,
            lastStay: null,
        }
        router.db
            .set('sequences.guestNumber', sequence)
            .set('guests', [...guests, guest])
            .set('guestCredentials', [...router.db.get('guestCredentials').value(), credential])
            .write()

        response.status(201).json({ id: guest.id, name: guest.name, email: guest.email })
    } catch (error) {
        next(error)
    }
})

server.use(router)
server.listen(port, () => {
    console.log(`JSON API is running at http://localhost:${port}`)
})
