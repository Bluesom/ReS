const API_BASE_URL = 'http://localhost:3000';
const getAdminHeaders = (headers = {}) => ({
    ...headers,
    Authorization: `Bearer ${sessionStorage.getItem('adminToken') || ''}`,
});

const fetchBookings = async () => {
    const response = await fetch(`${API_BASE_URL}/bookings`, { headers: getAdminHeaders() });
    if (!response.ok) throw new Error('Failed to load bookings from server.');
    return await response.json();
};

const fetchRooms = async () => {
    const response = await fetch(`${API_BASE_URL}/rooms`, { headers: getAdminHeaders() });
    if (!response.ok) throw new Error('Failed to load rooms from server.');
    return await response.json();
};

const fetchGuests = async () => {
    const response = await fetch(`${API_BASE_URL}/guests`, { headers: getAdminHeaders() });
    if (!response.ok) throw new Error('Failed to load guests from server.');
    return await response.json();
};

const fetchRoomTypes = async () => {
    const response = await fetch(`${API_BASE_URL}/roomTypes`, { headers: getAdminHeaders() });
    if (!response.ok) throw new Error('Failed to load room types from server.');
    return await response.json();
};

const sendJson = async (url, method, body, fallbackMessage) => {
    const response = await fetch(url, {
        method,
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(body),
    })
    const result = response.status === 204 ? null : await response.json()
    if (!response.ok) throw new Error(result?.error || fallbackMessage)
    return result
}

const saveRoom = (roomId, room) =>
    sendJson(`${API_BASE_URL}/rooms${roomId ? `/${encodeURIComponent(roomId)}` : ''}`, roomId ? 'PATCH' : 'POST', room, 'Could not save the room.')

const deleteRoom = (roomId) =>
    sendJson(`${API_BASE_URL}/rooms/${encodeURIComponent(roomId)}`, 'DELETE', {}, 'Could not delete the room.')

const saveRoomType = (roomTypeId, roomType) =>
    sendJson(`${API_BASE_URL}/roomTypes${roomTypeId ? `/${encodeURIComponent(roomTypeId)}` : ''}`, roomTypeId ? 'PATCH' : 'POST', roomType, 'Could not save the room type.')

const uploadImage = async (imageFile) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(imageFile.type) || imageFile.size > 5 * 1024 * 1024) {
        throw new Error('Choose a JPEG, PNG, or WebP photo that is 5 MB or smaller.')
    }
    const response = await fetch(`${API_BASE_URL}/uploads/image`, {
        method: 'POST',
        headers: getAdminHeaders({ 'Content-Type': imageFile.type }),
        body: imageFile,
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Could not upload the photo.')
    return result.imagePath
}

const deleteRoomType = (roomTypeId) =>
    sendJson(`${API_BASE_URL}/roomTypes/${encodeURIComponent(roomTypeId)}`, 'DELETE', {}, 'Could not delete the room type.')

const saveGuest = (guestId, guest) =>
    sendJson(`${API_BASE_URL}/guests${guestId ? `/${encodeURIComponent(guestId)}` : ''}`, guestId ? 'PATCH' : 'POST', guest, 'Could not save the guest.')

const setGuestActive = (guestId, active) =>
    sendJson(`${API_BASE_URL}/guests/${encodeURIComponent(guestId)}`, 'PATCH', { active }, 'Could not update the guest account.')

const fetchOffers = async () => {
    const response = await fetch(`${API_BASE_URL}/offers?admin=true`, { headers: getAdminHeaders() });
    if (!response.ok) throw new Error('Failed to load offers from server.');
    return await response.json();
};

const updateBooking = (bookingId, changes) =>
    sendJson(`${API_BASE_URL}/bookings/${encodeURIComponent(bookingId)}`, 'PATCH', changes, 'Failed to update booking.')

const saveOffer = async (offerId, offer) => {
    const response = await fetch(`${API_BASE_URL}/offers${offerId ? `/${encodeURIComponent(offerId)}` : ''}`, {
        method: offerId ? 'PATCH' : 'POST',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(offer),
    })
    const result = response.status === 204 ? null : await response.json()
    if (!response.ok) throw new Error(result?.error || 'Could not save the offer.')
    return result
}

const deleteOffer = async (offerId) => {
    const response = await fetch(`${API_BASE_URL}/offers/${encodeURIComponent(offerId)}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
    })
    if (response.status === 204) return
    const result = await response.json()
    throw new Error(result.error || 'Could not delete the offer.')
}

// --- GLOBAL STATE ---

const state = {
    bookings: [],
    rooms: [],
    roomTypes: [],
    guests: [],
    offers: [],
    filters: {
        status: 'all',   // 'all' | 'confirmed' | 'pending' | 'checked-in' | 'checked-out' | 'cancelled'
        search: '',      // matched against guest name and email, case-insensitive
    },
}

// --- STYLING & FORMATTING HELPERS ---

const STATUS_BADGE_STYLES = {
    confirmed: 'bg-lake/20 text-forest',
    pending: 'bg-sun/25 text-[#7a5a1e]',
    'checked-in': 'bg-forest text-white',
    'checked-out': 'bg-mist text-ink/60',
    cancelled: 'bg-clay/15 text-clay',
    overdue: 'bg-clay/15 text-clay',
    active: 'bg-lake/20 text-forest',
    inactive: 'bg-mist text-ink/60',
    maintenance: 'bg-clay/15 text-clay',
}

const formatStatusLabel = (status) =>
    String(status || 'unknown').split('-').map((word) => word[0].toUpperCase() + word.slice(1)).join(' ')

const escapeHtml = (value) =>
    String(value ?? '').replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    })[character])

const renderStatusBadge = (status) => {
    const classes = STATUS_BADGE_STYLES[status] || 'bg-mist text-ink/60'
    return `<span class="status-badge ${classes}">${escapeHtml(formatStatusLabel(status))}</span>`
}

const getBookingDisplayStatus = (booking) => {
    const today = new Date().toISOString().slice(0, 10)
    if (
        ['confirmed', 'checked-in'].includes(booking.status) &&
        booking.checkOut < today
    ) return 'overdue'
    if (booking.status === 'confirmed' && booking.checkIn < today) return 'overdue'
    return booking.status
}

const formatDate = (isoDate) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate || '')) return '—'
    const utcDate = new Date(`${isoDate}T00:00:00.000Z`)
    if (Number.isNaN(utcDate.getTime()) || utcDate.toISOString().slice(0, 10) !== isoDate) return '—'
    const [year, month, day] = isoDate.split('-').map(Number)
    const date = new Date(year, month - 1, day, 12)
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatCurrency = (amount) =>
    (Number.isFinite(Number(amount)) ? Number(amount) : 0)
        .toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

// --- KPI CALCULATIONS & RENDERING ---

const calculateKpis = (bookings, rooms) => {
    const todayIso = new Date().toISOString().slice(0, 10)

    const revenueStatuses = new Set(['confirmed', 'checked-in', 'checked-out'])
    const totalRevenue = bookings
        .filter((booking) => revenueStatuses.has(booking.status))
        .reduce((sum, booking) => sum + (Number.isFinite(Number(booking.totalAmount)) ? Number(booking.totalAmount) : 0), 0)

    const occupiedRooms = rooms.filter((room) => getRoomStay(room).status === 'occupied').length
    const occupancyRate = rooms.length ? Math.round((occupiedRooms / rooms.length) * 100) : 0

    const todaysCheckIns = bookings.filter(
        (booking) => booking.checkIn === todayIso && booking.status === 'confirmed'
    ).length

    const pendingBookings = bookings.filter((booking) => booking.status === 'pending').length

    return { totalRevenue, occupancyRate, todaysCheckIns, pendingBookings }
}

const renderKpiCards = (kpis) => {
    const cards = [
        { label: 'Total Revenue', value: formatCurrency(kpis.totalRevenue), icon: 'fa-sack-dollar', accent: 'bg-forest text-white' },
        { label: 'Occupancy Rate', value: `${kpis.occupancyRate}%`, icon: 'fa-bed', accent: 'bg-lake/25 text-forest' },
        { label: "Today's Check-ins", value: kpis.todaysCheckIns, icon: 'fa-door-open', accent: 'bg-sun/30 text-[#7a5a1e]' },
        { label: 'Pending Bookings', value: kpis.pendingBookings, icon: 'fa-hourglass-half', accent: 'bg-clay/15 text-clay' },
    ]

    const container = document.querySelector('#kpi-cards')
    container.innerHTML = cards
        .map(
            (card) => `
        <div class="rounded-md border border-forest/10 bg-white p-5 shadow-sm">
            <div class="mb-4 grid size-11 place-items-center rounded-full ${card.accent}">
                <i class="fa-solid ${card.icon}" aria-hidden="true"></i>
            </div>
            <p class="text-xs font-semibold uppercase tracking-wide text-ink/50">${card.label}</p>
            <p class="mt-1 text-2xl font-semibold text-forest">${card.value}</p>
        </div>`
        )
        .join('')
}

// --- TABLE RENDERING FUNCTIONS ---

const renderRecentBookings = (bookings) => {
    const recent = [...bookings].sort((a, b) =>
        String(b.createdAt || b.checkIn).localeCompare(String(a.createdAt || a.checkIn))
    ).slice(0, 5)
    const body = document.querySelector('#recent-bookings-body')

    if (!recent.length) {
        body.innerHTML = '<tr><td class="py-6 text-center text-sm text-ink/50" colspan="4">No bookings have been submitted yet.</td></tr>'
        return
    }

    body.innerHTML = recent
        .map(
            (booking) => `
        <tr class="border-b border-forest/5 last:border-0">
            <td class="py-2 pr-4"><span class="font-medium">${escapeHtml(booking.guestName)}</span><span class="ml-2 text-xs text-ink/50">${escapeHtml(booking.guestNumber || '')}</span></td>
            <td class="py-2 pr-4 text-ink/70">${escapeHtml(booking.roomType)}</td>
            <td class="py-2 pr-4 text-ink/70">${formatDate(booking.checkIn)}</td>
            <td class="py-2">${renderStatusBadge(getBookingDisplayStatus(booking))}</td>
        </tr>`
        )
        .join('')
}

const renderBookingsTable = () => {
    const filtered = getFilteredBookings()
    const body = document.querySelector('#bookings-table-body')
    const emptyState = document.querySelector('#bookings-empty-state')

    emptyState.classList.toggle('hidden', filtered.length > 0)

    if (!filtered.length) {
        body.innerHTML = ''
        return
    }

    body.innerHTML = filtered
        .map(
            (booking) => `
        <tr class="hover:bg-paper/60">
            <td class="px-5 py-3"><span class="font-medium text-ink">${escapeHtml(booking.guestName)}</span><span class="ml-2 text-xs text-ink/50">${escapeHtml(booking.guestNumber || '')}</span></td>
            <td class="px-5 py-3 text-ink/70">${escapeHtml(booking.roomType)}</td>
            <td class="px-5 py-3 text-ink/70">${formatDate(booking.checkIn)}</td>
            <td class="px-5 py-3 text-ink/70">${formatDate(booking.checkOut)}</td>
            <td class="px-5 py-3">${renderStatusBadge(getBookingDisplayStatus(booking))}</td>
            <td class="px-5 py-3 text-right">
                <button type="button" class="view-booking-btn rounded-full border border-forest/20 px-3 py-1 text-xs font-semibold text-forest transition hover:bg-forest hover:text-white" data-booking-id="${escapeHtml(booking.id)}">
                    View
                </button>
            </td>
        </tr>`
        )
        .join('')
}

const ROOM_STATUS_STYLES = {
    available: 'bg-lake/20 text-forest',
    booked: 'bg-sun/25 text-[#7a5a1e]',
    pending: 'bg-sun/25 text-[#7a5a1e]',
    occupied: 'bg-forest text-white',
    overdue: 'bg-clay/15 text-clay',
    maintenance: 'bg-mist text-ink/60',
}

const getRoomStay = (room) => {
    const today = new Date().toISOString().slice(0, 10)
    const roomBookings = state.bookings
        .filter((booking) =>
            booking.roomId === room.id &&
            ['confirmed', 'checked-in'].includes(booking.status) &&
            booking.checkOut >= today
        )
        .sort((a, b) => {
            if (a.status !== b.status) return a.status === 'checked-in' ? -1 : 1
            return String(a.checkIn).localeCompare(String(b.checkIn))
        })
    const booking = roomBookings[0]

    if (!booking) {
        const overdueBooking = state.bookings.find((item) =>
            item.roomId === room.id &&
            ['confirmed', 'checked-in'].includes(item.status) &&
            item.checkOut < today
        )
        if (overdueBooking) return { status: 'overdue', booking: overdueBooking }
        const pendingBooking = state.bookings.find((item) =>
            item.roomId === room.id && item.status === 'pending' && item.checkOut >= today
        )
        if (pendingBooking && room.status !== 'maintenance') return { status: 'pending', booking: pendingBooking }
        return { status: room.status === 'maintenance' ? 'maintenance' : 'available', booking: null }
    }

    if (booking.status === 'checked-in') return { status: 'occupied', booking }
    if (booking.checkIn < today) return { status: 'overdue', booking }
    return { status: 'booked', booking }
}

const renderRoomsTable = (rooms) => {
    const body = document.querySelector('#rooms-table-body')
    document.querySelector('#rooms-empty-state').classList.toggle('hidden', rooms.length > 0)
    body.innerHTML = rooms
        .map((room) => {
            const stay = getRoomStay(room)
            const booking = stay.booking
            const stayText = booking
                ? `${stay.status === 'occupied' ? 'Occupied by' : stay.status === 'overdue' ? 'Overdue:' : stay.status === 'pending' ? 'Pending:' : 'Booked for'} ${escapeHtml(booking.guestName)} · ${stay.status === 'booked' ? 'until ' : ''}${formatDate(booking.checkOut)}`
                : stay.status === 'maintenance' ? 'Under maintenance' : 'Available'
            return `
        <tr class="hover:bg-paper/60">
            <td class="px-5 py-3 font-medium text-ink">Room ${escapeHtml(room.roomNumber)}</td>
            <td class="px-5 py-3 text-ink/70">${escapeHtml(room.type)}</td>
            <td class="px-5 py-3 text-ink/70">${escapeHtml(room.floor)}</td>
            <td class="px-5 py-3"><span class="status-badge ${ROOM_STATUS_STYLES[stay.status] || 'bg-mist text-ink/60'}">${escapeHtml(formatStatusLabel(stay.status))}</span></td>
            <td class="px-5 py-3 text-ink/70">${stayText}</td>
            <td class="px-5 py-3 text-right"><button type="button" class="room-details-btn rounded-full border border-forest/20 px-3 py-1 text-xs font-semibold text-forest hover:bg-mist" data-room-id="${escapeHtml(room.id)}">Details</button></td>
        </tr>`
        })
        .join('')
}

const renderRoomInventory = () => {
    const body = document.querySelector('#room-inventory-body')
    const rooms = state.rooms
    document.querySelector('#room-inventory-empty').classList.toggle('hidden', rooms.length > 0)
    body.innerHTML = rooms.map((room) => `
        <tr class="hover:bg-paper/60">
            <td class="px-5 py-3 font-medium text-ink">Room ${escapeHtml(room.roomNumber)}</td>
            <td class="px-5 py-3 text-ink/70">${escapeHtml(room.type)}</td>
            <td class="px-5 py-3 text-ink/70">${escapeHtml(room.floor)}</td>
            <td class="px-5 py-3">${renderStatusBadge(room.status === 'maintenance' ? 'maintenance' : 'available')}</td>
            <td class="px-5 py-3 text-right"><div class="inline-flex gap-2">
                <button type="button" class="room-edit-btn rounded-full border border-forest/20 px-3 py-1 text-xs font-semibold text-forest hover:bg-mist" data-room-id="${escapeHtml(room.id)}">Edit</button>
                <button type="button" class="room-delete-btn rounded-full border border-clay/30 px-3 py-1 text-xs font-semibold text-clay hover:bg-clay/10" data-room-id="${escapeHtml(room.id)}">Delete</button>
            </div></td>
        </tr>`).join('')
}

const renderRoomTypes = () => {
    const container = document.querySelector('#room-types-grid')
    document.querySelector('#room-types-empty').classList.toggle('hidden', state.roomTypes.length > 0)
    container.innerHTML = state.roomTypes.map((roomType) => `
        <article class="overflow-hidden rounded-md border border-forest/10 bg-white shadow-sm">
            ${roomType.imagePath ? `<img src="${escapeHtml(roomType.imagePath)}" alt="${escapeHtml(roomType.name)}" class="h-44 w-full object-cover" loading="lazy">` : '<div class="grid h-44 place-items-center bg-mist text-forest/50"><i class="fa-solid fa-bed text-3xl" aria-hidden="true"></i></div>'}
            <div class="space-y-3 p-5">
                <div class="flex items-start justify-between gap-3"><h4 class="font-semibold text-forest">${escapeHtml(roomType.name)}</h4><span class="shrink-0 text-sm font-semibold text-clay">${formatCurrency(roomType.ratePerNight)} / night</span></div>
                <p class="text-sm text-ink/65">${escapeHtml(roomType.description || 'No description yet.')}</p>
                <p class="text-xs text-ink/65">${escapeHtml(roomType.bedType || 'Queen')} bed · ${roomType.sofa ? 'Sofa · ' : ''}${roomType.smokingAllowed ? 'Smoking allowed' : 'Non-smoking'}</p>
                <p class="text-xs text-ink/65">Meal plan: ${escapeHtml(roomType.mealPlan || 'No meals')}</p>
                ${Array.isArray(roomType.amenities) && roomType.amenities.length ? `<p class="text-xs text-ink/55">${roomType.amenities.map(escapeHtml).join(' · ')}</p>` : ''}
                <p class="text-xs text-ink/50">Up to ${escapeHtml(roomType.capacity || 2)} guests · ${state.rooms.filter((room) => room.roomTypeId === roomType.id).length} physical rooms</p>
                <div class="flex justify-end gap-2 border-t border-forest/10 pt-3">
                    <button type="button" class="room-type-edit-btn rounded-full border border-forest/20 px-3 py-1 text-xs font-semibold text-forest hover:bg-mist" data-room-type-id="${escapeHtml(roomType.id)}">Edit</button>
                    <button type="button" class="room-type-delete-btn rounded-full border border-clay/30 px-3 py-1 text-xs font-semibold text-clay hover:bg-clay/10" data-room-type-id="${escapeHtml(roomType.id)}">Delete</button>
                </div>
            </div>
        </article>`).join('')
}

const renderGuestsTable = (guests) => {
    const body = document.querySelector('#guests-table-body')
    document.querySelector('#guests-empty-state').classList.toggle('hidden', guests.length > 0)
    body.innerHTML = guests
        .map(
            (guest) => `
        <tr class="hover:bg-paper/60">
            <td class="px-5 py-3 font-medium text-ink">${escapeHtml(guest.guestNumber || '—')}</td>
            <td class="px-5 py-3 font-medium text-ink">${escapeHtml(guest.name)}</td>
            <td class="px-5 py-3 text-ink/70">${escapeHtml(guest.email)}</td>
            <td class="px-5 py-3 text-ink/70">${Number(guest.totalBookings) || 0}</td>
            <td class="px-5 py-3 text-ink/70">${formatDate(guest.lastStay)}</td>
            <td class="px-5 py-3">${renderStatusBadge(guest.active === false ? 'inactive' : 'active')}</td>
            <td class="px-5 py-3 text-right"><div class="inline-flex gap-2">
                <button type="button" class="guest-edit-btn rounded-full border border-forest/20 px-3 py-1 text-xs font-semibold text-forest hover:bg-mist" data-guest-id="${escapeHtml(guest.id)}">Edit</button>
                <button type="button" class="guest-toggle-btn rounded-full border border-clay/30 px-3 py-1 text-xs font-semibold text-clay hover:bg-clay/10" data-guest-id="${escapeHtml(guest.id)}" data-active="${guest.active === false ? 'false' : 'true'}">${guest.active === false ? 'Reactivate' : 'Deactivate'}</button>
            </div></td>
        </tr>`
        )
        .join('')
}

const offerIsCurrentlyActive = (offer) => {
    const today = new Date().toISOString().slice(0, 10)
    return offer.active && offer.startDate <= today && offer.endDate >= today
}

const renderOffersTable = (offers) => {
    const body = document.querySelector('#offers-table-body')
    const emptyState = document.querySelector('#offers-empty-state')
    emptyState.classList.toggle('hidden', offers.length > 0)

    body.innerHTML = offers.map((offer) => {
        const discount = offer.discountType === 'percentage'
            ? `${Number(offer.discountValue)}% off`
            : `${formatCurrency(offer.discountValue)} off`
        const today = new Date().toISOString().slice(0, 10)
        const status = offerIsCurrentlyActive(offer)
            ? 'Live'
            : !offer.active
                ? 'Inactive'
                : offer.startDate > today
                    ? 'Scheduled'
                    : 'Expired'
        return `
            <tr class="hover:bg-paper/60">
                <td class="px-5 py-3"><span class="font-semibold text-forest">${escapeHtml(offer.title)}</span><span class="block max-w-sm truncate text-xs text-ink/55">${escapeHtml(offer.description)}</span></td>
                <td class="px-5 py-3 font-medium text-ink">${escapeHtml(discount)}</td>
                <td class="px-5 py-3 text-ink/70">${formatDate(offer.startDate)} – ${formatDate(offer.endDate)}</td>
                <td class="px-5 py-3"><span class="status-badge ${status === 'Live' ? 'bg-lake/20 text-forest' : status === 'Scheduled' ? 'bg-sun/25 text-[#7a5a1e]' : status === 'Expired' ? 'bg-clay/15 text-clay' : 'bg-mist text-ink/60'}">${status}</span></td>
                <td class="px-5 py-3 text-right">
                    <div class="inline-flex gap-2">
                        <button type="button" class="offer-edit-btn rounded-full border border-forest/20 px-3 py-1 text-xs font-semibold text-forest hover:bg-mist" data-offer-id="${escapeHtml(offer.id)}">Edit</button>
                        <button type="button" class="offer-delete-btn rounded-full border border-clay/30 px-3 py-1 text-xs font-semibold text-clay hover:bg-clay/10" data-offer-id="${escapeHtml(offer.id)}">Delete</button>
                    </div>
                </td>
            </tr>`
    }).join('')
}

const renderNotifications = (bookings) => {
    const pendingBookings = bookings
        .filter((booking) => booking.status === 'pending')
        .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    const pending = pendingBookings.slice(0, 5)
    const badge = document.querySelector('#notification-count')
    const list = document.querySelector('#notifications-list')
    const toggle = document.querySelector('#notifications-toggle')

    badge.textContent = pendingBookings.length
    badge.classList.toggle('hidden', pendingBookings.length === 0)
    toggle.setAttribute('aria-label', pendingBookings.length
        ? `Notifications: ${pendingBookings.length} pending booking request${pendingBookings.length === 1 ? '' : 's'}`
        : 'Notifications: no pending booking requests')

    list.innerHTML = pending.length
        ? pending.map((booking) => `
            <div class="rounded-sm px-3 py-2 text-sm hover:bg-mist">
                New request from <span class="font-semibold">${escapeHtml(booking.guestName)}</span>
                <span class="block text-xs text-ink/50">${formatDate(booking.checkIn)} · ${escapeHtml(booking.roomType)}</span>
            </div>`).join('')
        : '<p class="px-3 py-4 text-sm text-ink/50">No pending booking requests.</p>'
}

const renderAll = () => {
    renderKpiCards(calculateKpis(state.bookings, state.rooms))
    renderRecentBookings(state.bookings)
    renderBookingsTable()
    renderRoomsTable(state.rooms)
    renderRoomInventory()
    renderRoomTypes()
    renderGuestsTable(state.guests)
    renderOffersTable(state.offers)
    renderNotifications(state.bookings)
}

// --- FILTER & SEARCH LOGIC ---

const getFilteredBookings = () => {
    const { status, search } = state.filters
    const searchTerm = search.trim().toLowerCase()

    return state.bookings.filter((booking) => {
        const matchesStatus = status === 'all' || getBookingDisplayStatus(booking) === status
        const matchesSearch =
            searchTerm === '' ||
            (booking.guestNumber || '').toLowerCase().includes(searchTerm) ||
            booking.guestName.toLowerCase().includes(searchTerm) ||
            booking.email.toLowerCase().includes(searchTerm)

        return matchesStatus && matchesSearch
    })
}

const setStatusFilter = (status) => {
    state.filters.status = status
    document.querySelectorAll('.status-filter-chip').forEach((chip) => {
        chip.setAttribute('aria-pressed', String(chip.dataset.status === status))
    })
    renderBookingsTable()
}

const handleSearchInput = (event) => {
    state.filters.search = event.target.value
    renderBookingsTable()
}

// --- MODAL CONTROLS ---

let activeBookingId = null

const openBookingModal = (bookingId) => {
    const booking = state.bookings.find((item) => item.id === bookingId)
    if (!booking) return

    activeBookingId = bookingId

    document.querySelector('#modal-guest-name').textContent = booking.guestName
    document.querySelector('#modal-guest-email').textContent = booking.email
    document.querySelector('#modal-room-type').textContent = booking.roomType
    const assignedRoom = state.rooms.find((room) => room.id === booking.roomId)
    document.querySelector('#modal-assigned-room').textContent = assignedRoom ? `Room ${assignedRoom.roomNumber}` : 'Not assigned'
    document.querySelector('#modal-guest-count').textContent = booking.guests
    document.querySelector('#modal-check-in').textContent = formatDate(booking.checkIn)
    document.querySelector('#modal-check-out').textContent = formatDate(booking.checkOut)
    document.querySelector('#modal-total').textContent = formatCurrency(booking.totalAmount)
    document.querySelector('#modal-requests').textContent = booking.requests || 'None'
    document.querySelector('#modal-status-select').value = booking.status
    const roomSelect = document.querySelector('#modal-room-select')
    const compatibleRooms = state.rooms.filter((room) =>
        room.roomTypeId === booking.roomTypeId &&
        (room.status !== 'maintenance' || room.id === booking.roomId) &&
        !state.bookings.some((other) =>
            other.id !== booking.id &&
            other.roomId === room.id &&
            ['confirmed', 'checked-in'].includes(other.status) &&
            booking.checkIn < other.checkOut &&
            other.checkIn < booking.checkOut
        )
    )
    roomSelect.innerHTML = '<option value="">Not assigned</option>' + compatibleRooms
        .map((room) => `<option value="${escapeHtml(room.id)}">Room ${escapeHtml(room.roomNumber)} · Floor ${escapeHtml(room.floor)}</option>`)
        .join('')
    roomSelect.value = booking.roomId || ''

    const offerSelect = document.querySelector('#modal-offer-select')
    const eligibleOffers = state.offers.filter((offer) =>
        offer.active &&
        offer.startDate <= booking.checkIn &&
        offer.endDate >= booking.checkOut
    )
    const currentOffer = booking.appliedOffer
    if (currentOffer && !eligibleOffers.some((offer) => offer.id === currentOffer.id)) {
        eligibleOffers.unshift(currentOffer)
    }
    offerSelect.innerHTML = '<option value="">No offer</option>' + eligibleOffers
        .map((offer) => `<option value="${escapeHtml(offer.id)}">${escapeHtml(offer.title)} · ${offer.discountType === 'percentage' ? `${Number(offer.discountValue)}%` : `${formatCurrency(offer.discountValue)} off`}</option>`)
        .join('')
    offerSelect.value = currentOffer?.id || ''
    updateBookingOfferPreview(booking)

    const modal = document.querySelector('#booking-modal')
    modal.classList.remove('hidden')
    modal.classList.add('flex')
}

const updateBookingOfferPreview = (booking) => {
    const selectedId = document.querySelector('#modal-offer-select').value
    const selectedOffer = state.offers.find((offer) => offer.id === selectedId) ||
        (booking.appliedOffer?.id === selectedId ? booking.appliedOffer : null)
    const baseAmount = Number(booking.baseAmount ?? booking.totalAmount) || 0
    const discount = !selectedOffer
        ? 0
        : selectedOffer.discountType === 'percentage'
            ? baseAmount * Number(selectedOffer.discountValue) / 100
            : Math.min(baseAmount, Number(selectedOffer.discountValue))
    document.querySelector('#modal-offer-total').textContent = selectedOffer
        ? `Discount: ${formatCurrency(discount)} · New total: ${formatCurrency(baseAmount - discount)}`
        : `Base amount: ${formatCurrency(baseAmount)}`
}

const closeBookingModal = () => {
    const modal = document.querySelector('#booking-modal')
    modal.classList.add('hidden')
    modal.classList.remove('flex')
    activeBookingId = null
}

const openOfferModal = (offer = null) => {
    const dialog = document.querySelector('#offer-modal')
    const form = document.querySelector('#offer-form')
    const formError = document.querySelector('#offer-form-error')
    form.reset()
    formError.classList.add('hidden')
    document.querySelector('#offer-modal-title').textContent = offer ? 'Edit offer' : 'Add offer'
    form.elements.namedItem('id').value = offer?.id || ''
    form.elements.namedItem('title').value = offer?.title || ''
    form.elements.namedItem('description').value = offer?.description || ''
    form.elements.namedItem('discountType').value = offer?.discountType || 'percentage'
    form.elements.namedItem('discountValue').value = offer?.discountValue ?? ''
    form.elements.namedItem('startDate').value = offer?.startDate || ''
    form.elements.namedItem('endDate').value = offer?.endDate || ''
    form.elements.namedItem('imagePath').value = offer?.imagePath || ''
    form.elements.namedItem('photo').value = ''
    document.querySelector('#offer-photo-name').textContent = offer?.imagePath ? offer.imagePath.split('/').pop() : 'No photo selected.'
    document.querySelector('#offer-photo-remove').classList.toggle('hidden', !offer?.imagePath)
    form.elements.namedItem('active').checked = offer ? offer.active === true : true
    dialog.showModal()
    form.elements.namedItem('title').focus()
}

const openRoomModal = (room = null) => {
    const dialog = document.querySelector('#room-modal')
    const form = document.querySelector('#room-form')
    const roomTypeSelect = form.elements.namedItem('roomTypeId')
    form.reset()
    document.querySelector('#room-form-error').classList.add('hidden')
    document.querySelector('#room-modal-title').textContent = room ? 'Edit room' : 'Add room'
    form.elements.namedItem('id').value = room?.id || ''
    form.elements.namedItem('roomNumber').value = room?.roomNumber || ''
    form.elements.namedItem('floor').value = room?.floor ?? 1
    form.elements.namedItem('maintenance').checked = room?.status === 'maintenance'
    roomTypeSelect.innerHTML = state.roomTypes.map((roomType) =>
        `<option value="${escapeHtml(roomType.id)}">${escapeHtml(roomType.name)}</option>`
    ).join('')
    roomTypeSelect.value = room?.roomTypeId || state.roomTypes[0]?.id || ''
    dialog.showModal()
}

const openRoomTypeModal = (roomType = null) => {
    const form = document.querySelector('#room-type-form')
    form.reset()
    document.querySelector('#room-type-form-error').classList.add('hidden')
    document.querySelector('#room-type-modal-title').textContent = roomType ? 'Edit room type' : 'Add room type'
    form.elements.namedItem('id').value = roomType?.id || ''
    form.elements.namedItem('name').value = roomType?.name || ''
    form.elements.namedItem('description').value = roomType?.description || ''
    form.elements.namedItem('ratePerNight').value = roomType?.ratePerNight ?? ''
    form.elements.namedItem('capacity').value = roomType?.capacity ?? 2
    form.elements.namedItem('imagePath').value = roomType?.imagePath || ''
    form.elements.namedItem('bedType').value = roomType?.bedType || 'Queen'
    form.elements.namedItem('smokingAllowed').value = String(roomType?.smokingAllowed === true)
    form.elements.namedItem('mealPlan').value = roomType?.mealPlan || 'No meals'
    form.elements.namedItem('sofa').checked = roomType?.sofa === true
    const selectedAmenities = new Set(roomType?.amenities || [])
    form.querySelectorAll('input[name="amenities"]').forEach((input) => {
        input.checked = selectedAmenities.has(input.value)
    })
    form.elements.namedItem('photo').value = ''
    setRoomTypePhotoPreview(roomType?.imagePath || '', roomType?.imagePath ? roomType.imagePath.split('/').pop() : '')
    document.querySelector('#room-type-modal').showModal()
}

let roomTypePhotoObjectUrl = null

const setRoomTypePhotoPreview = (imagePath, displayName) => {
    const preview = document.querySelector('#room-type-photo-preview')
    const image = preview.querySelector('img')
    if (roomTypePhotoObjectUrl) {
        URL.revokeObjectURL(roomTypePhotoObjectUrl)
        roomTypePhotoObjectUrl = null
    }
    if (!imagePath) {
        preview.classList.add('hidden')
        image.removeAttribute('src')
        document.querySelector('#room-type-photo-name').textContent = ''
        document.querySelector('#room-type-photo-remove').classList.add('hidden')
        return
    }
    image.src = imagePath
    document.querySelector('#room-type-photo-name').textContent = displayName
    document.querySelector('#room-type-photo-remove').classList.remove('hidden')
    preview.classList.remove('hidden')
}

const openGuestModal = (guest = null) => {
    const form = document.querySelector('#guest-form')
    form.reset()
    document.querySelector('#guest-form-error').classList.add('hidden')
    document.querySelector('#guest-modal-title').textContent = guest ? 'Edit guest' : 'Add guest'
    form.elements.namedItem('id').value = guest?.id || ''
    form.elements.namedItem('name').value = guest?.name || ''
    form.elements.namedItem('email').value = guest?.email || ''
    form.elements.namedItem('phone').value = guest?.phone || ''
    form.elements.namedItem('country').value = guest?.country || ''
    const password = form.elements.namedItem('password')
    password.required = !guest
    password.value = ''
    document.querySelector('#guest-password-field').classList.toggle('hidden', Boolean(guest))
    document.querySelector('#guest-modal').showModal()
}

const openRoomDetails = (roomId) => {
    const room = state.rooms.find((item) => item.id === roomId)
    if (!room) return
    const roomType = state.roomTypes.find((item) => item.id === room.roomTypeId)
    const stay = getRoomStay(room)
    const booking = stay.booking
    document.querySelector('#room-details-title').textContent = `Room ${room.roomNumber}`
    document.querySelector('#room-details-content').innerHTML = `
        <p><span class="text-ink/50">Type:</span> ${escapeHtml(room.type)}</p>
        <p><span class="text-ink/50">Description:</span> ${escapeHtml(roomType?.description || 'No room description yet.')}</p>
        <p><span class="text-ink/50">Features:</span> ${escapeHtml([roomType?.bedType ? `${roomType.bedType} bed` : '', roomType?.sofa ? 'Sofa' : '', roomType?.smokingAllowed ? 'Smoking allowed' : 'Non-smoking', roomType?.mealPlan || 'No meals', ...(Array.isArray(roomType?.amenities) ? roomType.amenities : [])].filter(Boolean).join(' · '))}</p>
        <p><span class="text-ink/50">Floor:</span> ${escapeHtml(room.floor)} · <span class="text-ink/50">Rate:</span> ${formatCurrency(room.ratePerNight)} / night</p>
        <p><span class="text-ink/50">Status:</span> ${escapeHtml(formatStatusLabel(stay.status))}</p>
        ${roomType?.imagePath ? `<img src="${escapeHtml(roomType.imagePath)}" alt="${escapeHtml(roomType.name)}" class="h-44 w-full rounded-sm object-cover">` : ''}
        ${booking ? `
            <div class="mt-2 rounded-sm bg-paper p-4">
                <h3 class="mb-2 font-semibold text-forest">${stay.status === 'occupied' ? 'Current guest' : stay.status === 'overdue' ? 'Overdue stay / arrival' : stay.status === 'pending' ? 'Pending booking request' : 'Upcoming guest'}</h3>
                <p>${escapeHtml(booking.guestName)} · ${escapeHtml(booking.guestNumber || '')}</p>
                <p>${escapeHtml(booking.email)}</p>
                <p>${formatDate(booking.checkIn)} → ${formatDate(booking.checkOut)} · ${Number(booking.guests)} guest(s)</p>
                <p>Booking: ${renderStatusBadge(booking.status)}</p>
                <p>Offer: ${escapeHtml(booking.appliedOffer?.title || 'No offer applied')}</p>
                <p>Total: ${formatCurrency(booking.totalAmount)}</p>
                ${booking.requests ? `<p>Requests: ${escapeHtml(booking.requests)}</p>` : ''}
            </div>` : `<p class="rounded-sm bg-paper p-4 text-ink/65">${stay.status === 'maintenance' ? 'This room is unavailable for maintenance.' : 'No active or upcoming assigned booking.'}</p>`}
    `
    document.querySelector('#room-details-modal').showModal()
}

const handleModalSave = async () => {
    if (!activeBookingId) return

    const booking = state.bookings.find((item) => item.id === activeBookingId)
    if (!booking) return
    const newStatus = document.querySelector('#modal-status-select').value
    const roomId = document.querySelector('#modal-room-select').value || null
    if (['confirmed', 'checked-in'].includes(newStatus) && !roomId) {
        alert('Assign a physical room before confirming or checking the guest in.')
        return
    }
    const selectedOfferId = document.querySelector('#modal-offer-select').value
    const selectedOffer = state.offers.find((offer) => offer.id === selectedOfferId) ||
        (booking.appliedOffer?.id === selectedOfferId ? booking.appliedOffer : null)
    try {
        const updatedBooking = await updateBooking(activeBookingId, {
            status: newStatus,
            roomId,
            offerId: selectedOffer?.id || null,
        })
        state.bookings = state.bookings.map((booking) =>
            booking.id === updatedBooking.id
                ? { ...booking, ...updatedBooking, appliedOffer: updatedBooking.appliedOffer || null }
                : booking
        )
        renderAll()
        closeBookingModal()
    } catch (error) {
        alert(error.message)
    }
}

// --- VIEW NAVIGATION & SIDEBAR ---

const VIEW_TITLES = {
    overview: 'Overview',
    bookings: 'Bookings',
    rooms: 'Room operations',
    offers: 'Manage offers',
    guests: 'Guests',
}

const switchView = (viewName) => {
    document.querySelectorAll('.view-panel').forEach((panel) => {
        panel.classList.toggle('hidden', panel.id !== `view-${viewName}`)
    })

    document.querySelectorAll('.sidebar-nav-link').forEach((link) => {
        const isActive = link.dataset.view === viewName
        if (isActive) {
            link.setAttribute('aria-current', 'page')
        } else {
            link.removeAttribute('aria-current')
        }
    })

    document.querySelector('#view-title').textContent = VIEW_TITLES[viewName] || 'Overview'
    closeMobileSidebar()
}

const openMobileSidebar = () => {
    document.querySelector('#sidebar').classList.remove('-translate-x-full')
    document.querySelector('#sidebar-backdrop').classList.remove('hidden')
    document.querySelector('#sidebar-toggle').setAttribute('aria-expanded', 'true')
}

const closeMobileSidebar = () => {
    document.querySelector('#sidebar').classList.add('-translate-x-full')
    document.querySelector('#sidebar-backdrop').classList.add('hidden')
    document.querySelector('#sidebar-toggle').setAttribute('aria-expanded', 'false')
}

const toggleDropdown = (panelSelector, toggleSelector, otherPanelSelector) => {
    const panel = document.querySelector(panelSelector)
    const toggle = document.querySelector(toggleSelector)
    const otherPanel = document.querySelector(otherPanelSelector)

    const willOpen = panel.classList.contains('hidden')
    otherPanel.classList.add('hidden')
    panel.classList.toggle('hidden', !willOpen)
    toggle.setAttribute('aria-expanded', String(willOpen))
}

// --- INITIALIZATION & API STATE HANDLING ---

let dashboardListenersInitialized = false

const init = async () => {
    const loadingEl = document.querySelector('#api-loading')
    const errorEl = document.querySelector('#api-error')
    const errorMessageEl = document.querySelector('#api-error-message')
    const retryBtn = document.querySelector('#retry-btn')

    const token = sessionStorage.getItem('adminToken')
    if (!token) {
        window.location.replace('./login.html#login')
        return
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/admin-session`, {
            headers: getAdminHeaders(),
        })
        if (!response.ok) {
            sessionStorage.removeItem('adminToken')
            window.location.replace('./login.html#login')
            return
        }
        const admin = await response.json()
        document.querySelector('#admin-name').textContent = admin.name
        document.querySelector('#admin-initials').textContent =
            admin.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
    } catch (error) {
        loadingEl.classList.add('hidden')
        errorMessageEl.textContent = 'Could not verify your administrator session. Check that the API is running and try again.'
        errorEl.classList.remove('hidden')
        console.error('Administrator session verification failed:', error)
        return
    }

    // 1. LOADING STATE: Show spinner, hide error container
    loadingEl.classList.remove('hidden')
    errorEl.classList.add('hidden')

    try {
        // Concurrently fetch all real API endpoints
        const [bookings, rooms, guests, roomTypes, offers] = await Promise.all([
            fetchBookings(),
            fetchRooms(),
            fetchGuests(),
            fetchRoomTypes(),
            fetchOffers(),
        ])

        const guestsById = new Map(guests.map((guest) => [guest.id, guest]))
        const roomTypesById = new Map(roomTypes.map((roomType) => [roomType.id, roomType]))

        // Assign fetched data to global state
        state.bookings = bookings.map((booking) => {
            const guest = guestsById.get(booking.guestId)
            const roomType = roomTypesById.get(booking.roomTypeId)
            if (!guest || !roomType) {
                throw new Error(`Booking ${booking.id} has an invalid guest or room type reference.`)
            }
            return { ...booking, guestName: guest.name, guestNumber: guest.guestNumber, email: guest.email, roomType: roomType.name }
        })
        state.rooms = rooms.map((room) => {
            const roomType = roomTypesById.get(room.roomTypeId)
            if (!roomType) throw new Error(`Room ${room.id} has an invalid room type reference.`)
            return { ...room, type: roomType.name, ratePerNight: roomType.ratePerNight }
        })
        state.roomTypes = roomTypes
        const bookingsByGuest = new Map()
        state.bookings.forEach((booking) => {
            const guestBookings = bookingsByGuest.get(booking.guestId) || []
            guestBookings.push(booking)
            bookingsByGuest.set(booking.guestId, guestBookings)
        })
        state.guests = guests.map((guest) => {
            const guestBookings = bookingsByGuest.get(guest.id) || []
            const lastStay = guestBookings
                .filter((booking) => booking.status === 'checked-out' && booking.checkOut)
                .map((booking) => booking.checkOut)
                .sort()
                .at(-1) || null
            return {
                ...guest,
                totalBookings: guestBookings.length,
                lastStay,
            }
        })
        state.offers = offers

        // 2. SUCCESS STATE: Hide spinner, render dashboard interface
        loadingEl.classList.add('hidden')
        renderAll()

    } catch (error) {
        // 3. ERROR STATE: Hide spinner, display error message and retry button
        loadingEl.classList.add('hidden')
        errorMessageEl.textContent = error.message
        errorEl.classList.remove('hidden')
        console.error('API Connection Error:', error)
    }

    // --- Try Again Button Handler ---
    retryBtn.onclick = () => {
        init()
    }

    if (dashboardListenersInitialized) return
    dashboardListenersInitialized = true

    // --- Event Listeners ---
    document.querySelector('#refresh-dashboard').addEventListener('click', () => {
        init()
    })
    document.querySelectorAll('.sidebar-nav-link').forEach((link) => {
        link.addEventListener('click', () => switchView(link.dataset.view))
    })
    document.querySelector('[data-view-link="bookings"]').addEventListener('click', () => switchView('bookings'))

    document.querySelector('#sidebar-toggle').addEventListener('click', openMobileSidebar)
    document.querySelector('#sidebar-backdrop').addEventListener('click', closeMobileSidebar)

    document.querySelectorAll('.status-filter-chip').forEach((chip) => {
        chip.addEventListener('click', () => setStatusFilter(chip.dataset.status))
    })
    document.querySelector('#booking-search').addEventListener('input', handleSearchInput)

    document.querySelector('#bookings-table-body').addEventListener('click', (event) => {
        const button = event.target.closest('.view-booking-btn')
        if (button) openBookingModal(button.dataset.bookingId)
    })

    document.querySelector('#modal-close').addEventListener('click', closeBookingModal)
    document.querySelector('#modal-cancel').addEventListener('click', closeBookingModal)
    document.querySelector('#modal-save').addEventListener('click', handleModalSave)
    document.querySelector('#booking-modal').addEventListener('click', (event) => {
        if (event.target.id === 'booking-modal') closeBookingModal()
    })
    document.querySelector('#modal-offer-select').addEventListener('change', () => {
        const booking = state.bookings.find((item) => item.id === activeBookingId)
        if (booking) updateBookingOfferPreview(booking)
    })
    document.querySelector('#room-details-close').addEventListener('click', () => document.querySelector('#room-details-modal').close())
    document.querySelectorAll('.room-section-tab').forEach((tab) => {
        tab.addEventListener('click', () => {
            const section = tab.dataset.roomSection
            document.querySelectorAll('.room-section-tab').forEach((item) => {
                const selected = item === tab
                item.setAttribute('aria-selected', String(selected))
                item.classList.toggle('bg-forest', selected)
                item.classList.toggle('text-white', selected)
                item.classList.toggle('border', !selected)
                item.classList.toggle('border-forest/20', !selected)
                item.classList.toggle('text-forest', !selected)
            })
            document.querySelectorAll('.room-section-panel').forEach((panel) =>
                panel.classList.toggle('hidden', panel.id !== `rooms-${section}-panel`)
            )
        })
    })
    document.querySelector('#room-create').addEventListener('click', () => {
        if (!state.roomTypes.length) {
            const feedback = document.querySelector('#rooms-feedback')
            feedback.textContent = 'Create a room type before adding a physical room.'
            feedback.classList.remove('hidden')
            Array.from(document.querySelectorAll('.room-section-tab')).find((tab) => tab.dataset.roomSection === 'types').click()
            return
        }
        openRoomModal()
    })
    document.querySelector('#room-cancel').addEventListener('click', () => document.querySelector('#room-modal').close())
    document.querySelector('#room-form').addEventListener('submit', async (event) => {
        event.preventDefault()
        const form = event.currentTarget
        const error = document.querySelector('#room-form-error')
        const button = document.querySelector('#room-save')
        const roomId = form.elements.namedItem('id').value
        error.classList.add('hidden')
        button.disabled = true
        try {
            await saveRoom(roomId, {
                roomNumber: form.elements.namedItem('roomNumber').value.trim(),
                roomTypeId: form.elements.namedItem('roomTypeId').value,
                floor: Number(form.elements.namedItem('floor').value),
                status: form.elements.namedItem('maintenance').checked ? 'maintenance' : 'available',
            })
            document.querySelector('#room-modal').close()
            await init()
            const feedback = document.querySelector('#rooms-feedback')
            feedback.textContent = roomId ? 'Room updated.' : 'Room added.'
            feedback.classList.remove('hidden')
        } catch (saveError) {
            error.textContent = saveError.message
            error.classList.remove('hidden')
        } finally {
            button.disabled = false
        }
    })
    document.querySelector('#rooms-table-body').addEventListener('click', (event) => {
        const button = event.target.closest('.room-details-btn')
        if (button) openRoomDetails(button.dataset.roomId)
    })
    document.querySelector('#room-inventory-body').addEventListener('click', async (event) => {
        const button = event.target.closest('[data-room-id]')
        if (!button) return
        const room = state.rooms.find((item) => item.id === button.dataset.roomId)
        if (!room) return
        if (button.classList.contains('room-edit-btn')) {
            openRoomModal(room)
            return
        }
        if (!button.classList.contains('room-delete-btn') || !window.confirm(`Delete room ${room.roomNumber}? Rooms with booking history cannot be deleted.`)) return
        button.disabled = true
        const feedback = document.querySelector('#rooms-feedback')
        try {
            await deleteRoom(room.id)
            await init()
            feedback.textContent = `Room ${room.roomNumber} deleted.`
            feedback.classList.remove('hidden')
        } catch (deleteError) {
            feedback.textContent = deleteError.message
            feedback.classList.remove('hidden')
            button.disabled = false
        }
    })
    document.querySelector('#room-type-create').addEventListener('click', () => openRoomTypeModal())
    document.querySelector('#room-type-cancel').addEventListener('click', () => document.querySelector('#room-type-modal').close())
    document.querySelector('#room-type-modal').addEventListener('close', () => {
        if (roomTypePhotoObjectUrl) URL.revokeObjectURL(roomTypePhotoObjectUrl)
        roomTypePhotoObjectUrl = null
    })
    document.querySelector('#room-type-photo').addEventListener('change', (event) => {
        const imageFile = event.currentTarget.files[0]
        if (!imageFile) return
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(imageFile.type) || imageFile.size > 5 * 1024 * 1024) {
            event.currentTarget.value = ''
            document.querySelector('#room-type-form-error').textContent = 'Choose a JPEG, PNG, or WebP photo that is 5 MB or smaller.'
            document.querySelector('#room-type-form-error').classList.remove('hidden')
            return
        }
        document.querySelector('#room-type-form-error').classList.add('hidden')
        const previewUrl = URL.createObjectURL(imageFile)
        setRoomTypePhotoPreview(previewUrl, imageFile.name)
        roomTypePhotoObjectUrl = previewUrl
    })
    document.querySelector('#room-type-photo-remove').addEventListener('click', () => {
        document.querySelector('#room-type-photo').value = ''
        document.querySelector('#room-type-form').elements.namedItem('imagePath').value = ''
        setRoomTypePhotoPreview('', '')
    })
    document.querySelector('#room-type-form').addEventListener('submit', async (event) => {
        event.preventDefault()
        const form = event.currentTarget
        const error = document.querySelector('#room-type-form-error')
        const button = document.querySelector('#room-type-save')
        const roomTypeId = form.elements.namedItem('id').value
        error.classList.add('hidden')
        button.disabled = true
        try {
            const imageFile = form.elements.namedItem('photo').files[0]
            let imagePath = form.elements.namedItem('imagePath').value.trim()
            if (imageFile) {
                button.textContent = 'Uploading photo…'
                imagePath = await uploadImage(imageFile)
            }
            button.textContent = 'Saving room type…'
            await saveRoomType(roomTypeId, {
                name: form.elements.namedItem('name').value.trim(),
                description: form.elements.namedItem('description').value.trim(),
                ratePerNight: Number(form.elements.namedItem('ratePerNight').value),
                capacity: Number(form.elements.namedItem('capacity').value),
                imagePath,
                bedType: form.elements.namedItem('bedType').value,
                smokingAllowed: form.elements.namedItem('smokingAllowed').value === 'true',
                mealPlan: form.elements.namedItem('mealPlan').value,
                sofa: form.elements.namedItem('sofa').checked,
                amenities: Array.from(form.querySelectorAll('input[name="amenities"]:checked'), (input) => input.value),
            })
            document.querySelector('#room-type-modal').close()
            await init()
            const feedback = document.querySelector('#rooms-feedback')
            feedback.textContent = roomTypeId ? 'Room type updated.' : 'Room type added.'
            feedback.classList.remove('hidden')
        } catch (saveError) {
            error.textContent = saveError.message
            error.classList.remove('hidden')
        } finally {
            button.disabled = false
            button.textContent = 'Save room type'
        }
    })
    document.querySelector('#room-types-grid').addEventListener('click', async (event) => {
        const button = event.target.closest('[data-room-type-id]')
        if (!button) return
        const roomType = state.roomTypes.find((item) => item.id === button.dataset.roomTypeId)
        if (!roomType) return
        if (button.classList.contains('room-type-edit-btn')) {
            openRoomTypeModal(roomType)
            return
        }
        if (!button.classList.contains('room-type-delete-btn') || !window.confirm(`Delete "${roomType.name}"? Room types referenced by rooms or bookings cannot be deleted.`)) return
        button.disabled = true
        const feedback = document.querySelector('#rooms-feedback')
        try {
            await deleteRoomType(roomType.id)
            await init()
            feedback.textContent = 'Room type deleted.'
            feedback.classList.remove('hidden')
        } catch (deleteError) {
            feedback.textContent = deleteError.message
            feedback.classList.remove('hidden')
            button.disabled = false
        }
    })
    document.querySelector('#guest-create').addEventListener('click', () => openGuestModal())
    document.querySelector('#guest-cancel').addEventListener('click', () => document.querySelector('#guest-modal').close())
    document.querySelector('#guest-form').addEventListener('submit', async (event) => {
        event.preventDefault()
        const form = event.currentTarget
        const error = document.querySelector('#guest-form-error')
        const button = document.querySelector('#guest-save')
        const guestId = form.elements.namedItem('id').value
        error.classList.add('hidden')
        button.disabled = true
        try {
            const guest = {
                name: form.elements.namedItem('name').value.trim(),
                email: form.elements.namedItem('email').value.trim(),
                phone: form.elements.namedItem('phone').value.trim(),
                country: form.elements.namedItem('country').value.trim(),
            }
            if (!guestId) guest.password = form.elements.namedItem('password').value
            await saveGuest(guestId, guest)
            document.querySelector('#guest-modal').close()
            await init()
            const feedback = document.querySelector('#guests-feedback')
            feedback.textContent = guestId ? 'Guest details updated.' : 'Guest account created.'
            feedback.classList.remove('hidden')
        } catch (saveError) {
            error.textContent = saveError.message
            error.classList.remove('hidden')
        } finally {
            button.disabled = false
        }
    })
    document.querySelector('#guests-table-body').addEventListener('click', async (event) => {
        const button = event.target.closest('[data-guest-id]')
        if (!button) return
        const guest = state.guests.find((item) => item.id === button.dataset.guestId)
        if (!guest) return
        const feedback = document.querySelector('#guests-feedback')
        if (button.classList.contains('guest-edit-btn')) {
            openGuestModal(guest)
            return
        }
        const activate = button.dataset.active === 'false'
        const action = activate ? 'Reactivate' : 'Deactivate'
        if (!window.confirm(`${action} ${guest.name}'s account? Booking history will be kept.`)) return
        button.disabled = true
        try {
            await setGuestActive(guest.id, activate)
            await init()
            feedback.textContent = `Guest account ${activate ? 'reactivated' : 'deactivated'}.`
            feedback.classList.remove('hidden')
        } catch (updateError) {
            feedback.textContent = updateError.message
            feedback.classList.remove('hidden')
            button.disabled = false
        }
    })
    document.querySelector('#offer-create').addEventListener('click', () => openOfferModal())
    document.querySelector('#offer-cancel').addEventListener('click', () => document.querySelector('#offer-modal').close())
    document.querySelector('#offer-photo').addEventListener('change', (event) => {
        const imageFile = event.currentTarget.files[0]
        if (!imageFile) return
        const error = document.querySelector('#offer-form-error')
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(imageFile.type) || imageFile.size > 5 * 1024 * 1024) {
            event.currentTarget.value = ''
            error.textContent = 'Choose a JPEG, PNG, or WebP photo that is 5 MB or smaller.'
            error.classList.remove('hidden')
            return
        }
        error.classList.add('hidden')
        document.querySelector('#offer-photo-name').textContent = imageFile.name
        document.querySelector('#offer-photo-remove').classList.remove('hidden')
    })
    document.querySelector('#offer-photo-remove').addEventListener('click', () => {
        document.querySelector('#offer-form').elements.namedItem('photo').value = ''
        document.querySelector('#offer-form').elements.namedItem('imagePath').value = ''
        document.querySelector('#offer-photo-name').textContent = 'No photo selected.'
        document.querySelector('#offer-photo-remove').classList.add('hidden')
    })
    document.querySelector('#offer-form').addEventListener('submit', async (event) => {
        event.preventDefault()
        const form = event.currentTarget
        const error = document.querySelector('#offer-form-error')
        const saveButton = document.querySelector('#offer-save')
        error.classList.add('hidden')
        saveButton.disabled = true
        const offerId = form.elements.namedItem('id').value
        const imageFile = form.elements.namedItem('photo').files[0]
        let imagePath = form.elements.namedItem('imagePath').value.trim()
        saveButton.textContent = imageFile ? 'Uploading photo…' : 'Saving offer…'
        const offer = {
            title: form.elements.namedItem('title').value.trim(),
            description: form.elements.namedItem('description').value.trim(),
            discountType: form.elements.namedItem('discountType').value,
            discountValue: Number(form.elements.namedItem('discountValue').value),
            startDate: form.elements.namedItem('startDate').value,
            endDate: form.elements.namedItem('endDate').value,
            imagePath,
            active: form.elements.namedItem('active').checked,
        }
        try {
            if (imageFile) {
                imagePath = await uploadImage(imageFile)
                offer.imagePath = imagePath
                saveButton.textContent = 'Saving offer…'
            }
            const savedOffer = await saveOffer(offerId, offer)
            state.offers = offerId
                ? state.offers.map((item) => item.id === offerId ? savedOffer : item)
                : [...state.offers, savedOffer]
            renderOffersTable(state.offers)
            document.querySelector('#offers-feedback').textContent = offerId ? 'Offer updated.' : 'Offer created.'
            document.querySelector('#offers-feedback').classList.remove('hidden')
            document.querySelector('#offer-modal').close()
        } catch (saveError) {
            error.textContent = saveError instanceof TypeError
                ? 'Could not connect to the account service. Make sure the API is running.'
                : saveError.message
            error.classList.remove('hidden')
        } finally {
            saveButton.disabled = false
            saveButton.textContent = 'Save offer'
        }
    })
    document.querySelector('#offers-table-body').addEventListener('click', async (event) => {
        const button = event.target.closest('[data-offer-id]')
        if (!button) return
        const offer = state.offers.find((item) => item.id === button.dataset.offerId)
        if (!offer) return
        if (button.classList.contains('offer-edit-btn')) {
            openOfferModal(offer)
            return
        }
        if (!button.classList.contains('offer-delete-btn') || !window.confirm(`Delete "${offer.title}"? This cannot be undone.`)) return

        button.disabled = true
        const feedback = document.querySelector('#offers-feedback')
        feedback.classList.add('hidden')
        try {
            await deleteOffer(offer.id)
            state.offers = state.offers.filter((item) => item.id !== offer.id)
            renderOffersTable(state.offers)
            feedback.textContent = 'Offer deleted.'
            feedback.classList.remove('hidden')
        } catch (deleteError) {
            feedback.textContent = deleteError instanceof TypeError
                ? 'Could not connect to the account service. Make sure the API is running.'
                : deleteError.message
            feedback.classList.remove('hidden')
            button.disabled = false
        }
    })
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeBookingModal()
    })

    document.querySelector('#notifications-toggle').addEventListener('click', (event) => {
        event.stopPropagation()
        toggleDropdown('#notifications-panel', '#notifications-toggle', '#profile-panel')
    })
    document.querySelector('#profile-toggle').addEventListener('click', (event) => {
        event.stopPropagation()
        toggleDropdown('#profile-panel', '#profile-toggle', '#notifications-panel')
    })
    document.addEventListener('click', () => {
        document.querySelector('#notifications-panel').classList.add('hidden')
        document.querySelector('#profile-panel').classList.add('hidden')
    })

    document.querySelector('#admin-logout').addEventListener('click', async () => {
        try {
            await fetch(`${API_BASE_URL}/auth/admin-logout`, {
                method: 'POST',
                headers: getAdminHeaders(),
            })
        } catch (error) {
            console.error('Administrator logout request failed:', error)
        } finally {
            sessionStorage.removeItem('adminToken')
            window.location.replace('./login.html#login')
        }
    })
}

// Run initialization when page loads
document.addEventListener('DOMContentLoaded', init)