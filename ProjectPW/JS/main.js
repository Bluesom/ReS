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
document.querySelectorAll('#Home .hero_title, #Home p, .reservation_hero h1, .reservation_hero p').forEach((text) => {
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

// ================== RESERVATION FORM (BookOrder.html) ==================
// Everything below is scoped to the booking page and does nothing on other pages.
const reservationForm = document.querySelector('#reservation-form')

if (reservationForm) {
    const roomOptions = [...reservationForm.querySelectorAll('.room_options .room_option')]
    const roomError = document.querySelector('#room-error')
    const datesError = document.querySelector('#dates-error')
    const checkinInput = document.querySelector('#checkin')
    const checkoutInput = document.querySelector('#checkout')
    const guestsSelect = document.querySelector('#guests')

    const paymentOptions = [...reservationForm.querySelectorAll('.payment_options .room_option')]
    const paymentError = document.querySelector('#payment-error')
    const cardFields = document.querySelector('#card-fields')
    const cardNameInput = document.querySelector('#card-name')
    const cardNumberInput = document.querySelector('#card-number')
    const cardExpiryInput = document.querySelector('#card-expiry')
    const cardCvvInput = document.querySelector('#card-cvv')

    const paymentLabels = {
        card: 'Credit / Debit Card',
        transfer: 'Bank Transfer',
        hotel: 'Pay at the Hotel',
    }

    const summaryRoom = document.querySelector('#summary-room')
    const summaryDates = document.querySelector('#summary-dates')
    const summaryNights = document.querySelector('#summary-nights')
    const summaryGuests = document.querySelector('#summary-guests')
    const summaryPayment = document.querySelector('#summary-payment')
    const summaryTotal = document.querySelector('#summary-total')

    const reservationSection = document.querySelector('#reservation-section')
    const confirmationPanel = document.querySelector('#reservation-confirmation')
    const confirmationName = document.querySelector('#confirmation-name')
    const confirmationRoom = document.querySelector('#confirmation-room')
    const confirmationNights = document.querySelector('#confirmation-nights')
    const confirmationPayment = document.querySelector('#confirmation-payment')
    const confirmationCode = document.querySelector('#confirmation-code')

    let selectedRoom = null
    let selectedPayment = null

    // Prevent picking a check-in date in the past, and keep check-out after it.
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const toDateInputValue = (date) => date.toISOString().slice(0, 10)
    checkinInput.min = toDateInputValue(today)

    const dateFormatter = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

    const nightsBetween = (checkin, checkout) => {
        const oneDay = 24 * 60 * 60 * 1000
        return Math.round((checkout - checkin) / oneDay)
    }

    const updateSummary = () => {
        // Room
        summaryRoom.textContent = selectedRoom
            ? `${selectedRoom.name} (\u20ac${selectedRoom.price}/night)`
            : 'Not selected yet'

        // Dates and nights
        const checkinValue = checkinInput.value
        const checkoutValue = checkoutInput.value
        let nights = 0

        if (checkinValue && checkoutValue) {
            const checkin = new Date(checkinValue)
            const checkout = new Date(checkoutValue)
            nights = nightsBetween(checkin, checkout)

            if (nights > 0) {
                summaryDates.textContent = `${dateFormatter.format(checkin)} \u2013 ${dateFormatter.format(checkout)}`
                summaryNights.textContent = `${nights} night${nights === 1 ? '' : 's'}`
                datesError.hidden = true
            } else {
                summaryDates.textContent = `${dateFormatter.format(checkin)} \u2013 ${dateFormatter.format(checkout)}`
                summaryNights.textContent = '\u2013'
            }
        } else {
            summaryDates.textContent = 'Add your check-in and check-out'
            summaryNights.textContent = '\u2013'
        }

        // Guests
        summaryGuests.textContent = guestsSelect.value

        // Payment method
        summaryPayment.textContent = selectedPayment ? paymentLabels[selectedPayment] : 'Not selected yet'

        // Total
        const total = selectedRoom && nights > 0 ? selectedRoom.price * nights : 0
        summaryTotal.textContent = `\u20ac${total.toLocaleString()}`

        return nights
    }

    roomOptions.forEach((option) => {
        option.addEventListener('click', () => {
            roomOptions.forEach((other) => {
                other.classList.remove('is-selected')
                other.setAttribute('aria-checked', 'false')
            })

            option.classList.add('is-selected')
            option.setAttribute('aria-checked', 'true')

            selectedRoom = {
                name: option.dataset.room,
                price: Number(option.dataset.price),
            }

            roomError.hidden = true
            updateSummary()
        })
    })

    paymentOptions.forEach((option) => {
        option.addEventListener('click', () => {
            paymentOptions.forEach((other) => {
                other.classList.remove('is-selected')
                other.setAttribute('aria-checked', 'false')
            })

            option.classList.add('is-selected')
            option.setAttribute('aria-checked', 'true')

            selectedPayment = option.dataset.payment
            paymentError.hidden = true
            cardFields.hidden = selectedPayment !== 'card'

            updateSummary()
        })
    })

    checkinInput.addEventListener('change', () => {
        // Keep check-out at least one night after check-in.
        if (checkinInput.value) {
            const nextDay = new Date(checkinInput.value)
            nextDay.setDate(nextDay.getDate() + 1)
            checkoutInput.min = toDateInputValue(nextDay)

            if (checkoutInput.value && new Date(checkoutInput.value) <= new Date(checkinInput.value)) {
                checkoutInput.value = toDateInputValue(nextDay)
            }
        }

        updateSummary()
    })

    checkoutInput.addEventListener('change', updateSummary)
    guestsSelect.addEventListener('change', updateSummary)

    reservationForm.addEventListener('submit', (event) => {
        event.preventDefault()

        let isValid = true

        if (!selectedRoom) {
            roomError.hidden = false
            isValid = false
        }

        const nights = updateSummary()

        if (!checkinInput.value || !checkoutInput.value || nights <= 0) {
            datesError.hidden = false
            isValid = false
        }

        if (!selectedPayment) {
            paymentError.hidden = false
            isValid = false
        } else if (selectedPayment === 'card') {
            const cardComplete = cardNameInput.value.trim() && cardNumberInput.value.trim() && cardExpiryInput.value.trim() && cardCvvInput.value.trim()

            if (!cardComplete) {
                paymentError.textContent = 'Please fill in the card details, or choose another payment method.'
                paymentError.hidden = false
                isValid = false
            }
        }

        if (!reservationForm.checkValidity()) {
            reservationForm.reportValidity()
            isValid = false
        }

        if (!isValid) return

        // No backend is connected yet, so we simulate a confirmed request locally.
        const fullName = document.querySelector('#fullname').value.trim()
        const referenceCode = `GHM-${Date.now().toString().slice(-6)}`

        confirmationName.textContent = fullName.split(' ')[0] || fullName
        confirmationRoom.textContent = selectedRoom.name
        confirmationNights.textContent = `${nights} night${nights === 1 ? '' : 's'}`
        confirmationPayment.textContent = paymentLabels[selectedPayment]
        confirmationCode.textContent = referenceCode

        reservationSection.querySelector('.reservation_layout').hidden = true
        confirmationPanel.hidden = false
        confirmationPanel.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })

    updateSummary()

    const confirmationBack = document.querySelector('.confirmation_back')

    if (confirmationBack) {
        confirmationBack.addEventListener('click', (event) => {
            event.preventDefault()
            window.location.href = confirmationBack.getAttribute('href') || './index.html'
        })
    }
}
