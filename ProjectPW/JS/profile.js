// Profile page logic: tabs, personal info form, bookings list, password form (demo only).
(() => {
    // --- SAMPLE DATA (replace with API calls later) ---
    const defaultProfile = {
        name: 'Marco Rinaldi',
        email: 'marco.rinaldi@example.com',
        phone: '+39 333 123 4567',
        country: 'Italy',
        room: 'lake-view',
        notes: '',
    }

    const bookings = [
        { id: 'BK-1042', roomType: 'Lake View Room', checkIn: '2026-12-20', checkOut: '2026-12-27', guests: 2, status: 'confirmed' },
        { id: 'BK-1051', roomType: 'Mountain View Room', checkIn: '2027-02-05', checkOut: '2027-02-08', guests: 2, status: 'pending' },
        { id: 'BK-0987', roomType: 'Lake View Room', checkIn: '2026-07-10', checkOut: '2026-07-15', guests: 3, status: 'checked-out' },
        { id: 'BK-0812', roomType: 'Alpine Suite', checkIn: '2025-08-02', checkOut: '2025-08-06', guests: 2, status: 'checked-out' },
        { id: 'BK-0744', roomType: 'Mountain View Room', checkIn: '2025-03-14', checkOut: '2025-03-16', guests: 1, status: 'cancelled' },
    ]

    let profile = { ...defaultProfile }

    // --- HELPERS ---
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

    const showMessage = (el, message) => {
        el.textContent = message
        el.classList.remove('hidden')
    }

    // --- HEADER ---
    const renderHeader = () => {
        $('#profile-name').textContent = profile.name
        $('#profile-email').textContent = profile.email
        $('#profile-avatar').textContent = initials(profile.name)
    }

    const renderStats = () => {
        const completed = bookings.filter((b) => b.status === 'checked-out')
        const upcoming = bookings.filter((b) => ['confirmed', 'pending'].includes(b.status) && b.checkIn >= todayIso())
        const nights = completed.reduce((sum, b) => sum + nightsBetween(b.checkIn, b.checkOut), 0)

        $('#stat-stays').textContent = completed.length
        $('#stat-upcoming').textContent = upcoming.length
        $('#stat-nights').textContent = nights
    }

    // --- TABS ---
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

    // --- PERSONAL INFO FORM ---
    const profileForm = $('#profile-form')
    const profileStatus = $('#profile-status')

    const fillForm = () => {
        profileForm.name.value = profile.name
        profileForm.email.value = profile.email
        profileForm.phone.value = profile.phone
        profileForm.country.value = profile.country
        profileForm.room.value = profile.room
        profileForm.notes.value = profile.notes
    }

    profileForm.addEventListener('submit', (event) => {
        event.preventDefault()
        profile = {
            name: profileForm.name.value.trim(),
            email: profileForm.email.value.trim(),
            phone: profileForm.phone.value.trim(),
            country: profileForm.country.value.trim(),
            room: profileForm.room.value,
            notes: profileForm.notes.value.trim(),
        }
        renderHeader()
        showMessage(profileStatus, 'Your profile has been updated (demo only, nothing was sent or stored).')
    })

    $('#profile-reset').addEventListener('click', () => {
        profile = { ...defaultProfile }
        fillForm()
        renderHeader()
        profileStatus.classList.add('hidden')
    })

    // --- BOOKINGS LIST ---
    const renderBookings = () => {
        const list = $('#bookings-list')
        const empty = $('#bookings-empty')
        const sorted = [...bookings].sort((a, b) => (a.checkIn < b.checkIn ? 1 : -1))

        empty.classList.toggle('hidden', sorted.length > 0)

        list.innerHTML = sorted
            .map((booking) => {
                const nights = nightsBetween(booking.checkIn, booking.checkOut)
                const canCancel = ['confirmed', 'pending'].includes(booking.status) && booking.checkIn >= todayIso()
                return `
                <li class="flex flex-col gap-4 rounded-md border border-forest/10 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div class="mb-2 flex flex-wrap items-center gap-3">
                            <h3 class="font-semibold text-forest">${escapeHtml(booking.roomType)}</h3>
                            <span class="inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold ${BADGE_STYLES[booking.status] || 'bg-mist text-ink/60'}">${statusLabel(booking.status)}</span>
                        </div>
                        <p class="text-sm text-ink/70"><i class="fa-regular fa-calendar mr-2 text-clay" aria-hidden="true"></i>${fmt(booking.checkIn)} → ${fmt(booking.checkOut)} · ${nights} night${nights === 1 ? '' : 's'}</p>
                        <p class="mt-1 text-xs text-ink/55">${escapeHtml(booking.id)} · ${booking.guests} guest${booking.guests === 1 ? '' : 's'}</p>
                    </div>
                    ${canCancel ? `<button type="button" class="cancel-booking-btn shrink-0 rounded-full border border-clay/50 px-4 py-2 text-xs font-semibold text-clay transition hover:bg-clay hover:text-white" data-booking-id="${escapeHtml(booking.id)}">Cancel booking</button>` : ''}
                </li>`
            })
            .join('')
    }

    $('#bookings-list').addEventListener('click', (event) => {
        const button = event.target.closest('.cancel-booking-btn')
        if (!button) return
        const booking = bookings.find((item) => item.id === button.dataset.bookingId)
        if (!booking) return
        if (!window.confirm(`Cancel booking ${booking.id}?`)) return
        booking.status = 'cancelled'
        renderBookings()
        renderStats()
    })

    // --- PASSWORD FORM ---
    const passwordForm = $('#password-form')
    const passwordStatus = $('#password-status')

    passwordForm.addEventListener('submit', (event) => {
        event.preventDefault()
        if (passwordForm.next.value !== passwordForm.confirm.value) {
            showMessage(passwordStatus, 'The new passwords do not match.')
            return
        }
        if (passwordForm.next.value === passwordForm.current.value) {
            showMessage(passwordStatus, 'Choose a password different from your current one.')
            return
        }
        passwordForm.reset()
        showMessage(passwordStatus, 'Password updated (demo only, nothing was sent or stored).')
    })

    // --- INIT ---
    fillForm()
    renderHeader()
    renderStats()
    renderBookings()

    const initialTab = location.hash.replace('#', '')
    if (panels[initialTab]) selectTab(initialTab)
})()