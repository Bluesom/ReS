const mockBookings = [
    { id: 'BK-1001', guestName: 'Marco Rinaldi', email: 'marco.rinaldi@example.com', roomType: 'Lake View Room', checkIn: '2026-10-11', checkOut: '2026-10-14', guests: 2, status: 'pending', totalAmount: 540, requests: 'Late check-in, arriving around 9pm.' },
    { id: 'BK-1002', guestName: 'Giulia Conti', email: 'giulia.conti@example.com', roomType: 'Alpine Suite', checkIn: '2026-10-11', checkOut: '2026-10-13', guests: 2, status: 'confirmed', totalAmount: 760, requests: 'None.' },
    { id: 'BK-1003', guestName: 'Hans Gruber', email: 'hans.gruber@example.com', roomType: 'Mountain View Room', checkIn: '2026-10-09', checkOut: '2026-10-12', guests: 1, status: 'checked-in', totalAmount: 450, requests: 'Quiet room away from the elevator.' },
    { id: 'BK-1004', guestName: 'Sara Moretti', email: 'sara.moretti@example.com', roomType: 'Family Room', checkIn: '2026-10-15', checkOut: '2026-10-20', guests: 4, status: 'confirmed', totalAmount: 1250, requests: 'Extra bed for a child.' },
    { id: 'BK-1005', guestName: 'Elena Fischer', email: 'elena.fischer@example.com', roomType: 'Lake View Room', checkIn: '2026-10-03', checkOut: '2026-10-06', guests: 2, status: 'checked-out', totalAmount: 540, requests: 'None.' },
    { id: 'BK-1006', guestName: 'Tomas Novak', email: 'tomas.novak@example.com', roomType: 'Mountain View Room', checkIn: '2026-10-18', checkOut: '2026-10-19', guests: 1, status: 'cancelled', totalAmount: 150, requests: 'None.' },
    { id: 'BK-1007', guestName: 'Anna Keller', email: 'anna.keller@example.com', roomType: 'Alpine Suite', checkIn: '2026-10-11', checkOut: '2026-10-16', guests: 2, status: 'pending', totalAmount: 1900, requests: 'Celebrating an anniversary — champagne on arrival if possible.' },
    { id: 'BK-1008', guestName: 'Luca Bianchi', email: 'luca.bianchi@example.com', roomType: 'Family Room', checkIn: '2026-10-07', checkOut: '2026-10-10', guests: 3, status: 'checked-out', totalAmount: 750, requests: 'None.' },
    { id: 'BK-1009', guestName: 'Ingrid Hoffmann', email: 'ingrid.hoffmann@example.com', roomType: 'Lake View Room', checkIn: '2026-10-12', checkOut: '2026-10-15', guests: 2, status: 'confirmed', totalAmount: 540, requests: 'Ground floor if available.' },
    { id: 'BK-1010', guestName: 'Pietro Russo', email: 'pietro.russo@example.com', roomType: 'Mountain View Room', checkIn: '2026-10-22', checkOut: '2026-10-25', guests: 2, status: 'pending', totalAmount: 450, requests: 'None.' },
]

const mockRooms = [
    { id: 'R-101', roomNumber: '101', type: 'Lake View Room', floor: 1, ratePerNight: 180, status: 'occupied' },
    { id: 'R-102', roomNumber: '102', type: 'Lake View Room', floor: 1, ratePerNight: 180, status: 'available' },
    { id: 'R-201', roomNumber: '201', type: 'Mountain View Room', floor: 2, ratePerNight: 150, status: 'occupied' },
    { id: 'R-202', roomNumber: '202', type: 'Mountain View Room', floor: 2, ratePerNight: 150, status: 'maintenance' },
    { id: 'R-301', roomNumber: '301', type: 'Alpine Suite', floor: 3, ratePerNight: 380, status: 'occupied' },
    { id: 'R-302', roomNumber: '302', type: 'Alpine Suite', floor: 3, ratePerNight: 380, status: 'available' },
    { id: 'R-110', roomNumber: '110', type: 'Family Room', floor: 1, ratePerNight: 250, status: 'available' },
    { id: 'R-111', roomNumber: '111', type: 'Family Room', floor: 1, ratePerNight: 250, status: 'occupied' },
]

const mockGuests = [
    { id: 'G-01', name: 'Marco Rinaldi', email: 'marco.rinaldi@example.com', totalBookings: 2, lastStay: '2026-10-11' },
    { id: 'G-02', name: 'Giulia Conti', email: 'giulia.conti@example.com', totalBookings: 1, lastStay: '2026-10-11' },
    { id: 'G-03', name: 'Hans Gruber', email: 'hans.gruber@example.com', totalBookings: 3, lastStay: '2026-10-09' },
    { id: 'G-04', name: 'Sara Moretti', email: 'sara.moretti@example.com', totalBookings: 1, lastStay: '2026-10-15' },
    { id: 'G-05', name: 'Elena Fischer', email: 'elena.fischer@example.com', totalBookings: 4, lastStay: '2026-10-03' },
    { id: 'G-06', name: 'Anna Keller', email: 'anna.keller@example.com', totalBookings: 2, lastStay: '2026-10-11' },
    { id: 'G-07', name: 'Luca Bianchi', email: 'luca.bianchi@example.com', totalBookings: 1, lastStay: '2026-10-07' },
    { id: 'G-08', name: 'Ingrid Hoffmann', email: 'ingrid.hoffmann@example.com', totalBookings: 2, lastStay: '2026-10-12' },
]

const simulateNetworkDelay = (data, delayMs = 250) =>
    new Promise((resolve) => setTimeout(() => resolve(data), delayMs))

const fetchBookings = () => simulateNetworkDelay(mockBookings)
const fetchRooms = () => simulateNetworkDelay(mockRooms)
const fetchGuests = () => simulateNetworkDelay(mockGuests)

const updateBookingStatus = (bookingId, newStatus) => {
    const booking = mockBookings.find((item) => item.id === bookingId)
    if (booking) booking.status = newStatus
    return simulateNetworkDelay(booking, 150)
}

const state = {
    bookings: [],
    rooms: [],
    guests: [],
    filters: {
        status: 'all',   // 'all' | 'confirmed' | 'pending' | 'checked-in' | 'checked-out' | 'cancelled'
        search: '',       // matched against guest name and email, case-insensitive
    },
}

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

    // Reflect the active chip visually.
    document.querySelectorAll('.status-filter-chip').forEach((chip) => {
        chip.setAttribute('aria-pressed', String(chip.dataset.status === status))
    })

    renderBookingsTable()
}

const handleSearchInput = (event) => {
    state.filters.search = event.target.value
    renderBookingsTable()
}

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
    await updateBookingStatus(activeBookingId, newStatus)

    renderAll()
    closeBookingModal()
}

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

const init = async () => {
    const [bookings, rooms, guests] = await Promise.all([fetchBookings(), fetchRooms(), fetchGuests()])

    state.bookings = bookings
    state.rooms = rooms
    state.guests = guests

    renderAll()

    // --- Sidebar navigation ---
    document.querySelectorAll('.sidebar-nav-link').forEach((link) => {
        link.addEventListener('click', () => switchView(link.dataset.view))
    })
    // "View all" link on the Overview panel's recent-bookings card.
    document.querySelector('[data-view-link="bookings"]').addEventListener('click', () => switchView('bookings'))

    // --- Mobile sidebar toggle ---
    document.querySelector('#sidebar-toggle').addEventListener('click', openMobileSidebar)
    document.querySelector('#sidebar-backdrop').addEventListener('click', closeMobileSidebar)

    // --- Status filters + search ---
    document.querySelectorAll('.status-filter-chip').forEach((chip) => {
        chip.addEventListener('click', () => setStatusFilter(chip.dataset.status))
    })
    document.querySelector('#booking-search').addEventListener('input', handleSearchInput)

    // --- Bookings table row actions (event delegation, since rows are
    //     re-rendered on every filter/search change) ---
    document.querySelector('#bookings-table-body').addEventListener('click', (event) => {
        const button = event.target.closest('.view-booking-btn')
        if (button) openBookingModal(button.dataset.bookingId)
    })

    // --- Modal controls ---
    document.querySelector('#modal-close').addEventListener('click', closeBookingModal)
    document.querySelector('#modal-cancel').addEventListener('click', closeBookingModal)
    document.querySelector('#modal-save').addEventListener('click', handleModalSave)
    document.querySelector('#booking-modal').addEventListener('click', (event) => {
        if (event.target.id === 'booking-modal') closeBookingModal() // click on backdrop
    })
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeBookingModal()
    })

    // --- Header dropdowns ---
    document.querySelector('#notifications-toggle').addEventListener('click', (event) => {
        event.stopPropagation()
        toggleDropdown('#notifications-panel', '#notifications-toggle', '#profile-panel')
    })
    document.querySelector('#profile-toggle').addEventListener('click', (event) => {
        event.stopPropagation()
        toggleDropdown('#profile-panel', '#profile-toggle', '#notifications-panel')
    })
    // Click anywhere else closes both dropdowns.
    document.addEventListener('click', () => {
        document.querySelector('#notifications-panel').classList.add('hidden')
        document.querySelector('#profile-panel').classList.add('hidden')
    })
}

document.addEventListener('DOMContentLoaded', init)