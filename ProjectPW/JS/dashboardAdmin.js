const API_BASE_URL = 'http://localhost:3000';

const fetchBookings = async () => {
    const response = await fetch(`${API_BASE_URL}/bookings`);
    if (!response.ok) throw new Error('Failed to load bookings from server.');
    return await response.json();
};

const fetchRooms = async () => {
    const response = await fetch(`${API_BASE_URL}/rooms`);
    if (!response.ok) throw new Error('Failed to load rooms from server.');
    return await response.json();
};

const fetchGuests = async () => {
    const response = await fetch(`${API_BASE_URL}/guests`);
    if (!response.ok) throw new Error('Failed to load guests from server.');
    return await response.json();
};

const updateBookingStatus = async (bookingId, newStatus) => {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
    });
    if (!response.ok) throw new Error('Failed to update booking status.');
    return await response.json();
};

// --- GLOBAL STATE ---

const state = {
    bookings: [],
    rooms: [],
    guests: [],
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
}

const formatStatusLabel = (status) =>
    status.split('-').map((word) => word[0].toUpperCase() + word.slice(1)).join(' ')

const renderStatusBadge = (status) => {
    const classes = STATUS_BADGE_STYLES[status] || 'bg-mist text-ink/60'
    return `<span class="status-badge ${classes}">${formatStatusLabel(status)}</span>`
}

const formatDate = (isoDate) =>
    new Date(`${isoDate}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

const formatCurrency = (amount) =>
    amount.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

// --- KPI CALCULATIONS & RENDERING ---

const calculateKpis = (bookings, rooms) => {
    const todayIso = new Date().toISOString().slice(0, 10)

    const revenueStatuses = new Set(['confirmed', 'checked-in', 'checked-out'])
    const totalRevenue = bookings
        .filter((booking) => revenueStatuses.has(booking.status))
        .reduce((sum, booking) => sum + booking.totalAmount, 0)

    const occupiedRooms = rooms.filter((room) => room.status === 'occupied').length
    const occupancyRate = rooms.length ? Math.round((occupiedRooms / rooms.length) * 100) : 0

    const todaysCheckIns = bookings.filter(
        (booking) => booking.checkIn === todayIso && booking.status !== 'cancelled'
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
    const recent = [...bookings].sort((a, b) => (a.checkIn < b.checkIn ? 1 : -1)).slice(0, 5)
    const body = document.querySelector('#recent-bookings-body')

    body.innerHTML = recent
        .map(
            (booking) => `
        <tr class="border-b border-forest/5 last:border-0">
            <td class="py-2 pr-4">${booking.guestName}</td>
            <td class="py-2 pr-4 text-ink/70">${booking.roomType}</td>
            <td class="py-2 pr-4 text-ink/70">${formatDate(booking.checkIn)}</td>
            <td class="py-2">${renderStatusBadge(booking.status)}</td>
        </tr>`
        )
        .join('')
}

const renderBookingsTable = () => {
    const filtered = getFilteredBookings()
    const body = document.querySelector('#bookings-table-body')
    const emptyState = document.querySelector('#bookings-empty-state')

    emptyState.classList.toggle('hidden', filtered.length > 0)

    body.innerHTML = filtered
        .map(
            (booking) => `
        <tr class="hover:bg-paper/60">
            <td class="px-5 py-3 font-medium text-ink">${booking.guestName}</td>
            <td class="px-5 py-3 text-ink/70">${booking.roomType}</td>
            <td class="px-5 py-3 text-ink/70">${formatDate(booking.checkIn)}</td>
            <td class="px-5 py-3 text-ink/70">${formatDate(booking.checkOut)}</td>
            <td class="px-5 py-3">${renderStatusBadge(booking.status)}</td>
            <td class="px-5 py-3 text-right">
                <button type="button" class="view-booking-btn rounded-full border border-forest/20 px-3 py-1 text-xs font-semibold text-forest transition hover:bg-forest hover:text-white" data-booking-id="${booking.id}">
                    View
                </button>
            </td>
        </tr>`
        )
        .join('')
}

const ROOM_STATUS_STYLES = {
    available: 'bg-lake/20 text-forest',
    occupied: 'bg-forest text-white',
    maintenance: 'bg-clay/15 text-clay',
}

const renderRoomsTable = (rooms) => {
    const body = document.querySelector('#rooms-table-body')
    body.innerHTML = rooms
        .map(
            (room) => `
        <tr class="hover:bg-paper/60">
            <td class="px-5 py-3 font-medium text-ink">Room ${room.roomNumber}</td>
            <td class="px-5 py-3 text-ink/70">${room.type}</td>
            <td class="px-5 py-3 text-ink/70">${room.floor}</td>
            <td class="px-5 py-3 text-ink/70">${formatCurrency(room.ratePerNight)}</td>
            <td class="px-5 py-3">
                <span class="status-badge ${ROOM_STATUS_STYLES[room.status] || 'bg-mist text-ink/60'}">
                    ${formatStatusLabel(room.status)}
                </span>
            </td>
        </tr>`
        )
        .join('')
}

const renderGuestsTable = (guests) => {
    const body = document.querySelector('#guests-table-body')
    body.innerHTML = guests
        .map(
            (guest) => `
        <tr class="hover:bg-paper/60">
            <td class="px-5 py-3 font-medium text-ink">${guest.name}</td>
            <td class="px-5 py-3 text-ink/70">${guest.email}</td>
            <td class="px-5 py-3 text-ink/70">${guest.totalBookings}</td>
            <td class="px-5 py-3 text-ink/70">${formatDate(guest.lastStay)}</td>
        </tr>`
        )
        .join('')
}

const renderAll = () => {
    renderKpiCards(calculateKpis(state.bookings, state.rooms))
    renderRecentBookings(state.bookings)
    renderBookingsTable()
    renderRoomsTable(state.rooms)
    renderGuestsTable(state.guests)
}

// --- FILTER & SEARCH LOGIC ---

const getFilteredBookings = () => {
    const { status, search } = state.filters
    const searchTerm = search.trim().toLowerCase()

    return state.bookings.filter((booking) => {
        const matchesStatus = status === 'all' || booking.status === status
        const matchesSearch =
            searchTerm === '' ||
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
    document.querySelector('#modal-guest-count').textContent = booking.guests
    document.querySelector('#modal-check-in').textContent = formatDate(booking.checkIn)
    document.querySelector('#modal-check-out').textContent = formatDate(booking.checkOut)
    document.querySelector('#modal-total').textContent = formatCurrency(booking.totalAmount)
    document.querySelector('#modal-requests').textContent = booking.requests
    document.querySelector('#modal-status-select').value = booking.status

    const modal = document.querySelector('#booking-modal')
    modal.classList.remove('hidden')
    modal.classList.add('flex')
}

const closeBookingModal = () => {
    const modal = document.querySelector('#booking-modal')
    modal.classList.add('hidden')
    modal.classList.remove('flex')
    activeBookingId = null
}

const handleModalSave = async () => {
    if (!activeBookingId) return

    const newStatus = document.querySelector('#modal-status-select').value
    try {
        await updateBookingStatus(activeBookingId, newStatus)
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
    rooms: 'Rooms',
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

const init = async () => {
    const loadingEl = document.querySelector('#api-loading')
    const errorEl = document.querySelector('#api-error')
    const errorMessageEl = document.querySelector('#api-error-message')
    const retryBtn = document.querySelector('#retry-btn')

    // 1. LOADING STATE: Show spinner, hide error container
    loadingEl.classList.remove('hidden')
    errorEl.classList.add('hidden')

    try {
        // Concurrently fetch all real API endpoints
        const [bookings, rooms, guests] = await Promise.all([
            fetchBookings(),
            fetchRooms(),
            fetchGuests()
        ])

        // Assign fetched data to global state
        state.bookings = bookings
        state.rooms = rooms
        state.guests = guests

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

    // --- Event Listeners ---
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
}

// Run initialization when page loads
document.addEventListener('DOMContentLoaded', init)