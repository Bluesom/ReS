const API_BASE_URL = 'http://localhost:3000'

// Apply the scrolled appearance to the fixed navbar.
window.addEventListener('scroll', () => {
    document.querySelector('nav').classList.toggle('window-scroll', window.scrollY > 0)
})

// Manage the mobile menu, link selection, and Escape-key dismissal.
const navMenu = document.querySelector('#primary-navigation')
const navToggle = document.querySelector('.nav_toggle')
const navIcon = navToggle.querySelector('i')
const authLink = navMenu.querySelector('.nav-auth-login')
const guestToken = sessionStorage.getItem('guestToken')
const guestName = sessionStorage.getItem('guestName')

if (authLink) {
    const label = authLink.querySelector('span')
    const icon = authLink.querySelector('i')

    if (guestToken && guestName) {
        const firstName = guestName.trim().split(/\s+/)[0]
        authLink.href = './profile.php'
        label.textContent = `Welcome, ${firstName}`
        icon.className = 'fa-solid fa-user'
        authLink.setAttribute('aria-label', `Welcome, ${firstName}. Go to your profile`)
    } else {
        authLink.href = './login.php#login'
        label.textContent = 'Log in'
        icon.className = 'fa-solid fa-arrow-right-to-bracket'
        authLink.removeAttribute('aria-label')
    }
}

const bookNowLink = document.querySelector('.hero_cta')
if (bookNowLink) {
    bookNowLink.href = guestToken ? './BookOrder.php' : './login.php#login'
}

const publicOffers = document.querySelector('#public-offers')
if (publicOffers) {
    fetch(`${API_BASE_URL}/offers`)
        .then(async (response) => {
            const offers = await response.json()
            if (!response.ok) throw new Error(offers.error || 'Could not load current offers.')
            if (!offers.length) return

            publicOffers.replaceChildren(...offers.map((offer) => {
                const article = document.createElement('article')
                article.className = 'grid overflow-hidden rounded-md border border-forest/10 bg-white shadow-sm sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]'
                if (offer.imagePath) {
                    const image = document.createElement('img')
                    image.className = 'h-48 w-full object-cover sm:h-full'
                    image.src = offer.imagePath
                    image.alt = offer.title
                    image.loading = 'lazy'
                    article.append(image)
                }
                const content = document.createElement('div')
                content.className = 'p-5 sm:p-7'
                const badge = document.createElement('p')
                badge.className = 'mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-clay'
                const badgeIcon = document.createElement('i')
                badgeIcon.className = 'fa-solid fa-tag'
                badgeIcon.setAttribute('aria-hidden', 'true')
                const discountLabel = document.createElement('span')
                discountLabel.textContent = offer.discountType === 'percentage'
                    ? `${offer.discountValue}% off`
                    : `$${Number(offer.discountValue).toLocaleString()} off`
                badge.append(badgeIcon, discountLabel)
                const title = document.createElement('h3')
                title.className = 'mb-2 text-lg font-semibold text-forest'
                title.textContent = offer.title
                const description = document.createElement('p')
                description.className = 'leading-7 text-ink/75'
                description.textContent = offer.description
                const dates = document.createElement('p')
                dates.className = 'mt-4 text-xs text-ink/55'
                dates.textContent = `Available ${new Date(`${offer.startDate}T00:00:00`).toLocaleDateString()} – ${new Date(`${offer.endDate}T00:00:00`).toLocaleDateString()}`
                content.append(badge, title, description, dates)
                article.append(content)
                return article
            }))
        })
        .catch((error) => {
            console.error('Public offers loading failed:', error)
            const unavailable = document.createElement('p')
            unavailable.className = 'border-t border-forest/15 pt-6 text-sm leading-7 text-clay'
            unavailable.textContent = 'Current offers could not be loaded. Please try again later.'
            publicOffers.replaceChildren(unavailable)
        })
}

const setNavigationOpen = (isOpen) => {
    navMenu.classList.toggle('is-open', isOpen)
    navToggle.setAttribute('aria-expanded', String(isOpen))
    navToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation')
    navIcon.classList.toggle('fa-bars', !isOpen)
    navIcon.classList.toggle('fa-xmark', isOpen)
}

navToggle.addEventListener('click', () => {
    setNavigationOpen(!navMenu.classList.contains('is-open'))
})

navMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setNavigationOpen(false))
})

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navMenu.classList.contains('is-open')) {
        setNavigationOpen(false)
        navToggle.focus()
    }
})

window.addEventListener('resize', () => {
    if (window.innerWidth > 760) setNavigationOpen(false)
})

// Show or hide password fields wherever a toggle is provided.
document.querySelectorAll('[data-password-toggle]').forEach((toggle) => {
    toggle.addEventListener('click', () => {
        const passwordInput = document.getElementById(toggle.dataset.passwordToggle)
        const showPassword = passwordInput.type === 'password'
        passwordInput.type = showPassword ? 'text' : 'password'
        toggle.setAttribute('aria-pressed', String(showPassword))
        toggle.setAttribute('aria-label', showPassword ? 'Hide password' : 'Show password')
        toggle.querySelector('i').classList.toggle('fa-eye', !showPassword)
        toggle.querySelector('i').classList.toggle('fa-eye-slash', showPassword)
    })
})

// Keep one tapped gallery photo enlarged at a time.
const galleryItems = document.querySelectorAll('.about_gallery_item')

galleryItems.forEach((item) => {
    item.addEventListener('click', () => {
        const shouldEnlarge = !item.classList.contains('is-enlarged')

        galleryItems.forEach((galleryItem) => {
            galleryItem.classList.remove('is-enlarged')
            galleryItem.setAttribute('aria-pressed', 'false')
        })

        if (shouldEnlarge) {
            item.classList.add('is-enlarged')
            item.setAttribute('aria-pressed', 'true')
        }
    })
})

// Coordinate destination slides, indicator dots, and keyboard controls.
const destinationCarousel = document.querySelector('.destination_carousel')

if (destinationCarousel) {
    const destinationSlides = [...destinationCarousel.querySelectorAll('.destination_slide')]
    const destinationDots = [...destinationCarousel.querySelectorAll('.destination_dot')]
    let activeDestination = 0

    const showDestination = (index) => {
        activeDestination = (index + destinationSlides.length) % destinationSlides.length

        destinationSlides.forEach((slide, slideIndex) => {
            const isActive = slideIndex === activeDestination
            slide.hidden = !isActive
            slide.classList.toggle('is-active', isActive)
        })

        destinationDots.forEach((dot, dotIndex) => {
            const isActive = dotIndex === activeDestination
            dot.classList.toggle('is-active', isActive)
            dot.setAttribute('aria-current', String(isActive))
        })
    }

    destinationCarousel.querySelector('.destination_previous').addEventListener('click', () => {
        showDestination(activeDestination - 1)
    })

    destinationCarousel.querySelector('.destination_next').addEventListener('click', () => {
        showDestination(activeDestination + 1)
    })

    destinationDots.forEach((dot, index) => {
        dot.addEventListener('click', () => showDestination(index))
    })

    destinationCarousel.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') {
            event.preventDefault()
            showDestination(activeDestination - 1)
        } else if (event.key === 'ArrowRight') {
            event.preventDefault()
            showDestination(activeDestination + 1)
        }
    })
}

// Move the soft color highlight with the pointer across hero copy.
document.querySelectorAll('#Home .hero_title, #Home p').forEach((text) => {
    text.addEventListener('pointermove', (event) => {
        if (event.pointerType === 'touch') return

        const bounds = text.getBoundingClientRect()
        const x = event.clientX - bounds.left
        const y = event.clientY - bounds.top

        text.style.setProperty('--cursor-x', `${x}px`)
        text.style.setProperty('--cursor-y', `${y}px`)
        text.style.setProperty('--cursor-opacity', '1')
        text.classList.add('hero-text-highlight')
    })

    text.addEventListener('pointerleave', () => {
        text.style.setProperty('--cursor-opacity', '0')
    })

    text.addEventListener('transitionend', (event) => {
        if (event.propertyName !== '--cursor-opacity' || text.style.getPropertyValue('--cursor-opacity') !== '0') return

        text.classList.remove('hero-text-highlight')
        text.style.removeProperty('--cursor-x')
        text.style.removeProperty('--cursor-y')
        text.style.removeProperty('--cursor-opacity')
    })
})

<<<<<<< HEAD
// Auto-rotate the booking page's photo panel and re-run its progress bar each cycle.
const bookingGalleryImages = document.querySelectorAll('.booking_gallery_img')
const galleryProgressBar = document.querySelector('#galleryProgressBar')

if (bookingGalleryImages.length && galleryProgressBar) {
    let activeGalleryIndex = 0

    const showGalleryImage = (index) => {
        bookingGalleryImages.forEach((img, imgIndex) => {
            img.classList.toggle('is-active', imgIndex === index)
        })

        // Restart the CSS fill animation so it always matches the 5s interval below.
        galleryProgressBar.classList.remove('is-running')
        void galleryProgressBar.offsetWidth
        galleryProgressBar.classList.add('is-running')
    }

    showGalleryImage(activeGalleryIndex)

    setInterval(() => {
        activeGalleryIndex = (activeGalleryIndex + 1) % bookingGalleryImages.length
        showGalleryImage(activeGalleryIndex)
    }, 5000)
}

// Handle the booking form: date guardrails, validation, and a demo confirmation summary.
const bookingForm = document.querySelector('#bookingForm')

if (bookingForm) {
    const checkInInput = bookingForm.querySelector('#checkIn')
    const checkOutInput = bookingForm.querySelector('#checkOut')
    const formError = bookingForm.querySelector('#formError')
    const bookingSummary = document.querySelector('#bookingSummary')
    const roomLabels = {
        'lake-view': 'a Lake View Room',
        'mountain-view': 'a Mountain View Room',
        'suite': 'an Alpine Suite',
        'family': 'a Family Room'
    }

    // Don't let guests pick a check-in date in the past.
    const today = new Date().toISOString().split('T')[0]
    checkInInput.setAttribute('min', today)

    // Keep check-out from landing on or before check-in.
    checkInInput.addEventListener('change', () => {
        checkOutInput.setAttribute('min', checkInInput.value)
        if (checkOutInput.value && checkOutInput.value <= checkInInput.value) {
            checkOutInput.value = ''
        }
    })

    const showError = (message) => {
        formError.textContent = message
        formError.hidden = false
    }

    const hideError = () => {
        formError.hidden = true
    }

    const formatDate = (value) => new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
=======
// Keep the booking form honest: validate dates locally without implying a reservation was sent.
const bookingForm = document.querySelector('#booking-request-form')

if (bookingForm) {
    const arrivalInput = bookingForm.querySelector('#arrival')
    const departureInput = bookingForm.querySelector('#departure')
    const statusMessage = bookingForm.querySelector('#booking-form-status')
    const toLocalDateString = (date) => {
        const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        return localDate.toISOString().slice(0, 10)
    }

    arrivalInput.min = toLocalDateString(new Date())

    const updateDepartureMinimum = () => {
        const minimumDate = arrivalInput.value ? new Date(`${arrivalInput.value}T00:00:00`) : new Date()
        minimumDate.setDate(minimumDate.getDate() + 1)
        departureInput.min = toLocalDateString(minimumDate)

        if (departureInput.value && departureInput.value < departureInput.min) {
            departureInput.value = ''
        }
    }

    arrivalInput.addEventListener('change', updateDepartureMinimum)
    departureInput.addEventListener('change', () => {
        const isInvalid = arrivalInput.value && departureInput.value <= arrivalInput.value
        departureInput.setCustomValidity(isInvalid ? 'Choose a departure date after your arrival date.' : '')
>>>>>>> main
    })

    bookingForm.addEventListener('submit', (event) => {
        event.preventDefault()
<<<<<<< HEAD
        hideError()

        const fullName = bookingForm.fullName.value.trim()
        const email = bookingForm.email.value.trim()
        const checkIn = checkInInput.value
        const checkOut = checkOutInput.value
        const roomType = bookingForm.roomType.value

        if (!fullName || !email || !checkIn || !checkOut) {
            showError('Please fill in your name, email, and both dates to continue.')
            return
        }

        if (checkOut <= checkIn) {
            showError('Check-out date must be after the check-in date.')
            return
        }

        bookingSummary.querySelector('#summaryName').textContent = fullName
        bookingSummary.querySelector('#summaryRoom').textContent = roomLabels[roomType] || 'a room'
        bookingSummary.querySelector('#summaryCheckIn').textContent = formatDate(checkIn)
        bookingSummary.querySelector('#summaryCheckOut').textContent = formatDate(checkOut)

        bookingForm.hidden = true
        bookingSummary.hidden = false
        bookingSummary.setAttribute('tabindex', '-1')
        bookingSummary.focus()
    })

    const editButton = bookingSummary.querySelector('#bookingEditBtn')
    editButton.addEventListener('click', () => {
        bookingSummary.hidden = true
        bookingForm.hidden = false
    })
}
=======
        statusMessage.textContent = 'Your dates are selected. This demo does not send reservation requests. Please email hello@example.com to confirm availability.'
        statusMessage.classList.remove('hidden')
    })

    updateDepartureMinimum()
}

// Keep the static authentication demo from submitting credentials.
document.querySelectorAll('.auth-form').forEach((form) => {
    form.addEventListener('submit', (event) => {
        event.preventDefault()
        const statusMessage = form.querySelector('[role="status"]')
        statusMessage.textContent =
            'This demo does not authenticate users or create accounts. No credentials were sent.'
        statusMessage.classList.remove('hidden')
    })
})

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------
{
    const loginForm = document.querySelector('#login-form')

    if (loginForm) {
        const loginStatus = loginForm.querySelector('[role="status"]')
        const loginButton = loginForm.querySelector('button[type="submit"]')
        const registrationSuccess = sessionStorage.getItem('registrationSuccess')
        const passwordResetSuccess = sessionStorage.getItem('passwordResetSuccess')

        if (registrationSuccess || passwordResetSuccess) {
            loginStatus.textContent = registrationSuccess || passwordResetSuccess
            loginStatus.classList.remove('hidden')
            sessionStorage.removeItem('registrationSuccess')
            sessionStorage.removeItem('passwordResetSuccess')
        }

        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault()
            loginStatus.classList.add('hidden')
            loginButton.disabled = true

            try {
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: loginForm.elements.namedItem('email').value.trim(),
                        password: loginForm.elements.namedItem('password').value,
                    }),
                })
                const result = await response.json()

                if (!response.ok) throw new Error(result.error || 'Sign-in failed. Please try again.')
                if (result.role === 'admin') {
                    sessionStorage.removeItem('guestToken')
                    sessionStorage.removeItem('guestName')
                    sessionStorage.removeItem('guestEmail')
                    sessionStorage.setItem('adminToken', result.token)
                    window.location.assign('./admin.php')
                    return
                }

                sessionStorage.removeItem('adminToken')
                sessionStorage.setItem('guestToken', result.token)
                sessionStorage.setItem('guestName', result.account.name)
                sessionStorage.setItem('guestEmail', result.account.email)
                window.location.assign('./index.php')
            } catch (error) {
                loginStatus.textContent = error instanceof TypeError
                    ? 'Could not connect to the account service. Make sure the API is running with npm run api.'
                    : error.message
                loginStatus.classList.remove('hidden')
                loginStatus.classList.add('border-clay/30', 'bg-clay/10', 'text-clay')
            } finally {
                loginButton.disabled = false
            }
        })
    }
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------
{
    const registerForm = document.querySelector('#register-form')

    if (registerForm) {
        const registerStatus = registerForm.querySelector('[role="status"]')
        const registerButton = registerForm.querySelector('button[type="submit"]')
        const countryInput = registerForm.elements.namedItem('country')
        const countryCodeInput = registerForm.elements.namedItem('countryCode')
        const phoneCountrySelect = registerForm.elements.namedItem('phoneCountryCode')
        const phoneInput = registerForm.elements.namedItem('phone')
        let countriesByName = new Map()

        const showRegisterStatus = (message, isError = false) => {
            registerStatus.textContent = message
            registerStatus.classList.toggle('border-clay/30', isError)
            registerStatus.classList.toggle('bg-clay/10', isError)
            registerStatus.classList.toggle('text-clay', isError)
            registerStatus.classList.toggle('border-lake/30', !isError)
            registerStatus.classList.toggle('bg-mist', !isError)
            registerStatus.classList.toggle('text-forest', !isError)
            registerStatus.classList.toggle('hidden', false)
        }

        const loadCountries = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/metadata/countries`)
                const countries = await response.json()
                if (!response.ok) throw new Error(countries.error || 'Could not load the country list.')

                const countryOptions = document.querySelector('#country-options')
                countriesByName = new Map(countries.map((country) => [country.name.toLocaleLowerCase(), country]))
                countryOptions.replaceChildren(...countries.map((country) => {
                    const option = document.createElement('option')
                    option.value = country.name
                    return option
                }))

                phoneCountrySelect.replaceChildren(new Option('Choose a country code', ''))
                countries.forEach((country) => {
                    phoneCountrySelect.add(new Option(`${country.name} (+${country.dialCode})`, country.code))
                })
            } catch (error) {
                registerButton.disabled = true
                showRegisterStatus('Could not load the country list. Make sure the API is running, then reload this page.', true)
                console.error('Country list loading failed:', error)
            }
        }

        countryInput.addEventListener('input', () => {
            const country = countriesByName.get(countryInput.value.trim().toLocaleLowerCase())
            countryCodeInput.value = country ? country.code : ''
        })

        phoneInput.addEventListener('input', () => {
            const digitsOnly = phoneInput.value.replace(/\D/g, '').slice(0, 14)
            if (phoneInput.value !== digitsOnly) phoneInput.value = digitsOnly
        })

        loadCountries()

        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault()
            registerStatus.classList.add('hidden')
            registerStatus.textContent = ''
            registerButton.disabled = true

            try {
                const password = registerForm.elements.namedItem('password').value
                const confirmPassword = registerForm.elements.namedItem('confirmPassword').value
                if (!countryCodeInput.value) throw new Error('Choose a country from the country suggestions.')
                if (password !== confirmPassword) throw new Error('Passwords do not match.')
                if (!/\d/.test(password)) throw new Error('Password must include at least one number.')

                const response = await fetch(`${API_BASE_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: registerForm.elements.namedItem('name').value.trim(),
                        email: registerForm.elements.namedItem('email').value.trim(),
                        countryCode: countryCodeInput.value,
                        phoneCountryCode: phoneCountrySelect.value,
                        phone: phoneInput.value,
                        password,
                        confirmPassword,
                    }),
                })
                const result = await response.json()

                if (!response.ok) throw new Error(result.error || 'Registration failed. Please try again.')
                sessionStorage.setItem('registrationSuccess', 'Your account was created. You can now log in.')
                window.location.assign('./login.php#login')
            } catch (error) {
                const message = error instanceof TypeError
                    ? 'Could not connect to the account service. Make sure the API is running with npm run api.'
                    : error.message
                showRegisterStatus(message, true)
            } finally {
                registerButton.disabled = false
            }
        })
    }
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------
{
    const resetForm = document.querySelector('#reset-password-form')

    if (resetForm) {
        const resetStatus = resetForm.querySelector('[role="status"]')
        const resetButton = resetForm.querySelector('button[type="submit"]')
        const emailInput = resetForm.elements.namedItem('email')
        emailInput.value = sessionStorage.getItem('guestEmail') || ''

        const showResetStatus = (message, isError) => {
            resetStatus.textContent = message
            resetStatus.classList.toggle('border-clay/30', isError)
            resetStatus.classList.toggle('bg-clay/10', isError)
            resetStatus.classList.toggle('text-clay', isError)
            resetStatus.classList.toggle('border-lake/30', !isError)
            resetStatus.classList.toggle('bg-mist', !isError)
            resetStatus.classList.toggle('text-forest', !isError)
            resetStatus.classList.remove('hidden')
        }

        resetForm.addEventListener('submit', async (event) => {
            event.preventDefault()
            resetStatus.classList.add('hidden')
            resetButton.disabled = true

            try {
                const password = resetForm.elements.namedItem('password').value
                const confirmPassword = resetForm.elements.namedItem('confirmPassword').value
                if (password !== confirmPassword) throw new Error('Passwords do not match.')
                if (!/\d/.test(password)) throw new Error('Password must include at least one number.')

                const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: resetForm.elements.namedItem('email').value.trim(),
                        password,
                        confirmPassword,
                    }),
                })
                const result = await response.json()
                if (!response.ok) throw new Error(result.error || 'Could not change the password.')

                sessionStorage.setItem('passwordResetSuccess', result.message)
                sessionStorage.removeItem('guestToken')
                sessionStorage.removeItem('guestName')
                sessionStorage.removeItem('guestEmail')
                window.location.assign('./login.php#login')
            } catch (error) {
                const message = error instanceof TypeError
                    ? 'Could not connect to the account service. Make sure the API is running with npm run api.'
                    : error.message
                showResetStatus(message, true)
            } finally {
                resetButton.disabled = false
            }
        })
    }
}

// ---------------------------------------------------------------------------
// Guest-only booking access
// ---------------------------------------------------------------------------
{
    const bookingRequestForm = document.querySelector('#booking-request-form')

    if (bookingRequestForm) {
        const bookingStatus = document.querySelector('#booking-form-status')
        const bookingSubmit = bookingRequestForm.querySelector('button[type="submit"]')
        const arrivalInput = bookingRequestForm.elements.namedItem('arrival')
        const departureInput = bookingRequestForm.elements.namedItem('departure')
        const roomTypeSelect = bookingRequestForm.elements.namedItem('roomTypeId')
        const roomTypePreview = bookingRequestForm.querySelector('#room-type-preview')
        const guestCountSelect = bookingRequestForm.elements.namedItem('guests')
        const today = new Date().toISOString().slice(0, 10)
        arrivalInput.min = today
        departureInput.min = today
        bookingSubmit.disabled = true

        const showBookingStatus = (message, isError = false) => {
            bookingStatus.textContent = message
            bookingStatus.classList.toggle('border-clay/30', isError)
            bookingStatus.classList.toggle('bg-clay/10', isError)
            bookingStatus.classList.toggle('text-clay', isError)
            bookingStatus.classList.toggle('border-lake/30', !isError)
            bookingStatus.classList.toggle('bg-mist', !isError)
            bookingStatus.classList.toggle('text-forest', !isError)
            bookingStatus.classList.remove('hidden')
        }

        arrivalInput.addEventListener('change', () => {
            departureInput.min = arrivalInput.value || today
            if (departureInput.value && departureInput.value <= arrivalInput.value) {
                departureInput.value = ''
            }
        })

        if (!guestToken) {
            window.location.assign('./login.php#login')
        } else {
            fetch(`${API_BASE_URL}/auth/guest-session`, {
                headers: { Authorization: `Bearer ${guestToken}` },
            })
                .then(async (response) => {
                    if (response.status === 401) {
                        sessionStorage.removeItem('guestToken')
                        sessionStorage.removeItem('guestName')
                        sessionStorage.removeItem('guestEmail')
                        window.location.assign('./login.php#login')
                        return null
                    }
                    if (!response.ok) throw new Error('Could not verify your guest account. Please try again.')
                    return response.json()
                })
                .then((guest) => {
                    if (!guest) return
                    return fetch(`${API_BASE_URL}/metadata/room-types`)
                        .then(async (response) => {
                            const roomTypes = await response.json()
                            if (!response.ok) throw new Error(roomTypes.error || 'Could not load room types.')
                            if (!roomTypes.length) throw new Error('No room types are available to request.')

                            const roomTypesById = new Map(roomTypes.map((roomType) => [roomType.id, roomType]))
                            roomTypeSelect.replaceChildren(...roomTypes.map((roomType) => {
                                const option = document.createElement('option')
                                option.value = roomType.id
                                option.textContent = `${roomType.name} — $${Number(roomType.ratePerNight).toLocaleString()} per night`
                                return option
                            }))
                            const updateRoomTypePreview = () => {
                                const roomType = roomTypesById.get(roomTypeSelect.value)
                                roomTypePreview.replaceChildren()
                                if (!roomType) {
                                    roomTypePreview.classList.add('hidden')
                                    return
                                }
                                if (roomType.imagePath) {
                                    const image = document.createElement('img')
                                    image.src = roomType.imagePath
                                    image.alt = roomType.name
                                    image.className = 'h-48 w-full object-cover'
                                    image.loading = 'lazy'
                                    roomTypePreview.append(image)
                                }
                                const details = document.createElement('div')
                                details.className = 'space-y-1 p-4'
                                const title = document.createElement('p')
                                title.className = 'font-semibold text-forest'
                                title.textContent = roomType.name
                                const description = document.createElement('p')
                                description.className = 'text-sm text-ink/65'
                                description.textContent = roomType.description || 'Contact the hotel for room details.'
                                const capacity = Number(roomType.capacity) || 2
                                const capacityText = document.createElement('p')
                                capacityText.className = 'text-xs text-ink/55'
                                capacityText.textContent = `Up to ${capacity} guests · $${Number(roomType.ratePerNight).toLocaleString()} per night`
                                const features = [
                                    roomType.bedType ? `${roomType.bedType} bed` : '',
                                    roomType.sofa ? 'Sofa' : '',
                                    roomType.smokingAllowed ? 'Smoking allowed' : 'Non-smoking',
                                    ...(Array.isArray(roomType.amenities) ? roomType.amenities : []),
                                ].filter(Boolean)
                                const featuresText = document.createElement('p')
                                featuresText.className = 'text-xs text-ink/55'
                                featuresText.textContent = features.join(' · ')
                                details.append(title, description, capacityText, featuresText)
                                roomTypePreview.append(details)
                                guestCountSelect.querySelectorAll('option').forEach((option) => {
                                    option.disabled = Number(option.value) > capacity
                                })
                                if (Number(guestCountSelect.value) > capacity) {
                                    guestCountSelect.value = String(capacity)
                                }
                                roomTypePreview.classList.remove('hidden')
                            }
                            roomTypeSelect.addEventListener('change', updateRoomTypePreview)
                            updateRoomTypePreview()
                            roomTypeSelect.disabled = false
                            bookingSubmit.disabled = false
                        })
                })
                .then(() => {
                    if (bookingSubmit.disabled) return
                    bookingRequestForm.addEventListener('submit', async (event) => {
                        event.preventDefault()
                        bookingStatus.classList.add('hidden')
                        if (departureInput.value <= arrivalInput.value) {
                            showBookingStatus('Departure must be after arrival.', true)
                            return
                        }

                        bookingSubmit.disabled = true
                        try {
                            const response = await fetch(`${API_BASE_URL}/auth/guest-bookings`, {
                                method: 'POST',
                                headers: {
                                    Authorization: 'Bearer ' + guestToken,
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    checkIn: arrivalInput.value,
                                    checkOut: departureInput.value,
                                    guests: Number(bookingRequestForm.elements.namedItem('guests').value),
                                    roomTypeId: roomTypeSelect.value,
                                }),
                            })
                            const result = await response.json()
                            if (response.status === 401) {
                                sessionStorage.removeItem('guestToken')
                                sessionStorage.removeItem('guestName')
                                sessionStorage.removeItem('guestEmail')
                                window.location.assign('./login.php#login')
                                return
                            }
                            if (!response.ok) throw new Error(result.error || 'Could not save your request.')
                            showBookingStatus(`${result.message} Booking reference: ${result.booking.id}.`)
                            bookingRequestForm.reset()
                            arrivalInput.min = today
                            departureInput.min = today
                        } catch (error) {
                            showBookingStatus(error instanceof TypeError
                                ? 'Could not connect to the account service. Make sure the API is running with npm run api.'
                                : error.message, true)
                        } finally {
                            bookingSubmit.disabled = false
                        }
                    })
                })
                .catch((error) => {
                    showBookingStatus(error instanceof TypeError
                        ? 'Could not connect to the account service. Make sure the API is running with npm run api.'
                        : error.message, true)
                })
        }
    }
}

// ---------------------------------------------------------------------------
// Guest profile
// ---------------------------------------------------------------------------
if (document.querySelector('#profile-edit-form')) {
    (() => {
        let profile = null
        let bookings = []
        const $ = (selector) => document.querySelector(selector)

        const BADGE_STYLES = {
            confirmed: 'bg-lake/20 text-forest',
            pending: 'bg-sun/25 text-[#7a5a1e]',
            'checked-in': 'bg-forest text-white',
            'checked-out': 'bg-mist text-ink/60',
            cancelled: 'bg-clay/15 text-clay',
        }

        const statusLabel = (status) =>
            status.split('-').map((word) => word[0].toUpperCase() + word.slice(1)).join(' ')

        const fmt = (iso) =>
            new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

        const nightsBetween = (a, b) =>
            Math.round((new Date(`${b}T00:00:00`) - new Date(`${a}T00:00:00`)) / 86400000)

        const todayIso = () => new Date().toISOString().slice(0, 10)

        const initials = (name) =>
            name.trim().split(/\s+/).slice(0, 2).map((part) => part[0].toUpperCase()).join('') || '?'

        const escapeHtml = (text) =>
            String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]))

        const showMessage = (element, message) => {
            element.textContent = message
            element.classList.remove('hidden')
        }

        // Profile header and account statistics.
        const renderHeader = () => {
            $('#profile-name').textContent = profile.name
            $('#profile-email').textContent = profile.email
            $('#profile-avatar').textContent = initials(profile.name)
            $('#profile-detail-name').textContent = profile.name
            $('#profile-detail-email').textContent = profile.email
            $('#profile-detail-phone').textContent = profile.phone || 'Not provided'
            $('#profile-detail-country').textContent = profile.country || 'Not provided'
            $('#profile-member-since').textContent = profile.createdAt
                ? `Member since ${new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`
                : 'Member since date not recorded'
        }

        const renderStats = () => {
            const upcoming = bookings.filter((booking) =>
                ['confirmed', 'pending'].includes(booking.status) && booking.checkIn >= todayIso()
            )
            const completed = bookings.filter((booking) => booking.status === 'checked-out')
            const nights = completed.reduce((sum, booking) =>
                sum + nightsBetween(booking.checkIn, booking.checkOut), 0
            )

            $('#stat-stays').textContent = bookings.length
            $('#stat-upcoming').textContent = upcoming.length
            $('#stat-nights').textContent = nights
        }

        // Accessible profile tabs.
        const tabs = [...document.querySelectorAll('.profile-tab')]
        const panels = {
            info: $('#panel-info'),
            bookings: $('#panel-bookings'),
            security: $('#panel-security'),
        }

        const selectTab = (name, moveFocus = false) => {
            tabs.forEach((tab) => {
                const isActive = tab.dataset.tab === name
                tab.setAttribute('aria-selected', String(isActive))
                tab.tabIndex = isActive ? 0 : -1
                if (isActive && moveFocus) tab.focus()
            })
            Object.entries(panels).forEach(([key, panel]) => {
                panel.hidden = key !== name
            })
            if (history.replaceState) history.replaceState(null, '', `#${name}`)
        }

        tabs.forEach((tab, index) => {
            tab.addEventListener('click', () => selectTab(tab.dataset.tab))
            tab.addEventListener('keydown', (event) => {
                const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
                if (!keys.includes(event.key)) return
                event.preventDefault()
                const step = event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? -1 : 1
                const next = tabs[(index + step + tabs.length) % tabs.length]
                selectTab(next.dataset.tab, true)
            })
        })

        // Load and persist profile details using the signed-in guest session.
        const profileForm = $('#profile-edit-form')
        const profileStatus = $('#profile-status')
        const profileDialog = $('#profile-edit-dialog')
        const editStatus = $('#profile-edit-status')
        const saveButton = $('#profile-edit-save')
        const editOpenButton = $('#profile-edit-open')
        const countryInput = profileForm.elements.namedItem('country')
        const countryCodeInput = profileForm.elements.namedItem('countryCode')
        let countriesByName = new Map()
        editOpenButton.disabled = true

        const showEditError = (message) => {
            editStatus.textContent = message
            editStatus.classList.remove('hidden')
        }

        const openEditDialog = () => {
            profileForm.elements.namedItem('name').value = profile.name
            profileForm.elements.namedItem('email').value = profile.email
            profileForm.elements.namedItem('phone').value = profile.phone || ''
            countryInput.value = profile.country || ''
            countryCodeInput.value = countriesByName.get(countryInput.value.toLocaleLowerCase())?.code || ''
            editStatus.classList.add('hidden')
            profileDialog.showModal()
            profileForm.elements.namedItem('name').focus()
        }

        editOpenButton.addEventListener('click', openEditDialog)
        $('#profile-edit-cancel').addEventListener('click', () => profileDialog.close())
        profileDialog.addEventListener('click', (event) => {
            if (event.target === profileDialog) profileDialog.close()
        })
        countryInput.addEventListener('input', () => {
            countryCodeInput.value = countriesByName.get(countryInput.value.trim().toLocaleLowerCase())?.code || ''
        })

        profileForm.addEventListener('submit', async (event) => {
            event.preventDefault()
            editStatus.classList.add('hidden')
            saveButton.disabled = true

            try {
                if (!countryCodeInput.value) throw new Error('Choose a country from the country suggestions.')
                const response = await fetch(`${API_BASE_URL}/auth/guest-profile`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${sessionStorage.getItem('guestToken') || ''}`,
                    },
                    body: JSON.stringify({
                        name: profileForm.elements.namedItem('name').value.trim(),
                        email: profileForm.elements.namedItem('email').value.trim(),
                        phone: profileForm.elements.namedItem('phone').value.trim(),
                        countryCode: countryCodeInput.value,
                    }),
                })
                if (response.status === 401) {
                    sessionStorage.removeItem('guestToken')
                    sessionStorage.removeItem('guestName')
                    sessionStorage.removeItem('guestEmail')
                    window.location.assign('./login.php#login')
                    return
                }
                const result = await response.json()
                if (!response.ok) throw new Error(result.error || 'Could not save your profile details.')

                profile = result.guest
                sessionStorage.setItem('guestName', profile.name)
                sessionStorage.setItem('guestEmail', profile.email)
                renderHeader()
                showMessage(profileStatus, 'Your profile details have been saved.')
                profileDialog.close()
            } catch (error) {
                showEditError(error instanceof TypeError
                    ? 'Could not connect to the account service. Make sure the API is running with npm run api.'
                    : error.message)
            } finally {
                saveButton.disabled = false
            }
        })

        // Load the country list for the profile editor.
        fetch(`${API_BASE_URL}/metadata/countries`)
            .then(async (response) => {
                const countries = await response.json()
                if (!response.ok) throw new Error(countries.error || 'Could not load the country list.')
                countriesByName = new Map(countries.map((country) => [country.name.toLocaleLowerCase(), country]))
                $('#profile-country-options').replaceChildren(...countries.map((country) => {
                    const option = document.createElement('option')
                    option.value = country.name
                    return option
                }))
                editOpenButton.disabled = false
            })
            .catch((error) => {
                console.error('Profile country list loading failed:', error)
                showMessage(profileStatus, error instanceof TypeError
                    ? 'Could not connect to the account service. Make sure the API is running with npm run api.'
                    : error.message)
        })

        // Render only bookings returned for this guest by the API.
        const renderBookings = () => {
            const list = $('#bookings-list')
            const empty = $('#bookings-empty')
            const sorted = [...bookings].sort((a, b) => (a.checkIn < b.checkIn ? 1 : -1))

            empty.classList.toggle('hidden', sorted.length > 0)
            list.innerHTML = sorted
                .map((booking) => {
                    const nights = nightsBetween(booking.checkIn, booking.checkOut)
                    return `
                    <li class="flex flex-col gap-4 rounded-md border border-forest/10 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div class="mb-2 flex flex-wrap items-center gap-3">
                                <h3 class="font-semibold text-forest">${escapeHtml(booking.roomType)}</h3>
                                <span class="inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold ${BADGE_STYLES[booking.status] || 'bg-mist text-ink/60'}">${escapeHtml(statusLabel(booking.status))}</span>
                            </div>
                            <p class="text-sm text-ink/70"><i class="fa-regular fa-calendar mr-2 text-clay" aria-hidden="true"></i>${fmt(booking.checkIn)} → ${fmt(booking.checkOut)} · ${nights} night${nights === 1 ? '' : 's'}</p>
                            <p class="mt-1 text-xs text-ink/55">${escapeHtml(booking.id)} · ${booking.guests} guest${booking.guests === 1 ? '' : 's'}</p>
                        </div>
                    </li>`
                })
                .join('')
        }

        // Confirm password reset and sign out only after explicit confirmation.
        const passwordDialog = $('#password-warning-dialog')
        $('#profile-password-open').addEventListener('click', () => passwordDialog.showModal())
        $('#password-warning-cancel').addEventListener('click', () => passwordDialog.close())
        $('#password-warning-confirm').addEventListener('click', () => {
            window.location.assign('./ForgotPassword.php')
        })

        // Revoke the server session when the guest confirms logout.
        const logoutDialog = $('#logout-dialog')
        const logoutStatus = $('#logout-status')
        const logoutConfirm = $('#logout-confirm')
        $('#profile-logout-open').addEventListener('click', () => {
            logoutStatus.classList.add('hidden')
            logoutDialog.showModal()
        })
        $('#logout-cancel').addEventListener('click', () => logoutDialog.close())
        logoutConfirm.addEventListener('click', async () => {
            logoutConfirm.disabled = true
            try {
                const response = await fetch(`${API_BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${sessionStorage.getItem('guestToken') || ''}` },
                })
                if (!response.ok && response.status !== 401) {
                    throw new Error('Could not end your session. Please try again.')
                }
                sessionStorage.removeItem('guestToken')
                sessionStorage.removeItem('guestName')
                sessionStorage.removeItem('guestEmail')
                window.location.assign('./index.php')
            } catch (error) {
                logoutStatus.textContent = error instanceof TypeError
                    ? 'Could not connect to the account service. Make sure the API is running with npm run api.'
                    : error.message
                logoutStatus.classList.remove('hidden')
            } finally {
                logoutConfirm.disabled = false
            }
        })

        // Load the guest record and booking history from the authenticated API.
        const loadProfile = async () => {
            const token = sessionStorage.getItem('guestToken')
            if (!token) {
                window.location.assign('./login.php#login')
                return
            }

            try {
                const response = await fetch(`${API_BASE_URL}/auth/guest-profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (response.status === 401) {
                    sessionStorage.removeItem('guestToken')
                    sessionStorage.removeItem('guestName')
                    sessionStorage.removeItem('guestEmail')
                    window.location.assign('./login.php#login')
                    return
                }
                const result = await response.json()
                if (!response.ok) throw new Error(result.error || 'Could not load your profile.')

                profile = result.guest
                bookings = result.bookings
                sessionStorage.setItem('guestName', profile.name)
                sessionStorage.setItem('guestEmail', profile.email)
                renderHeader()
                renderStats()
                renderBookings()
            } catch (error) {
                showMessage(profileStatus, error instanceof TypeError
                    ? 'Could not connect to the account service. Make sure the API is running with npm run api.'
                    : error.message)
                $('#profile-detail-name').textContent = 'Unavailable'
                $('#profile-detail-email').textContent = 'Unavailable'
                $('#profile-detail-phone').textContent = 'Unavailable'
                $('#profile-detail-country').textContent = 'Unavailable'
                $('#profile-member-since').textContent = 'Membership date unavailable'
            }
        }

        const initialTab = location.hash.replace('#', '')
        if (panels[initialTab]) selectTab(initialTab)
        loadProfile()
    })()
}
>>>>>>> main
