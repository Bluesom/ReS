// Apply the scrolled appearance to the fixed navbar.
window.addEventListener('scroll', () => {
    document.querySelector('nav').classList.toggle('window-scroll', window.scrollY > 0)
})

// Manage the mobile menu, link selection, and Escape-key dismissal.
const navMenu = document.querySelector('#primary-navigation')
const navToggle = document.querySelector('.nav_toggle')
const navIcon = navToggle.querySelector('i')

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
    })

    bookingForm.addEventListener('submit', (event) => {
        event.preventDefault()
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