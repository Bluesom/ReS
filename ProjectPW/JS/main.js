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
    })

    bookingForm.addEventListener('submit', (event) => {
        event.preventDefault()
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
