<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard | Grand Hotel Misurina</title>
    <meta name="description" content="Staff dashboard for managing Grand Hotel Misurina bookings, rooms, and guests.">

    <link rel="stylesheet" href="./CSS/output.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css">
</head>

<body class="bg-mist font-sans text-ink antialiased">

    <!-- SIDEBAR NAVIGATION -->
    <aside
        id="sidebar"
        class="fixed inset-y-0 left-0 z-40 flex w-64 -translate-x-full flex-col bg-forest text-white transition-transform duration-300 lg:translate-x-0"
    >
        <!-- Brand / hotel name -->
        <div class="flex h-20 items-center gap-3 border-b border-white/10 px-6">
            <span class="grid size-9 place-items-center rounded-full bg-white text-forest">
                <i class="fa-solid fa-hotel text-lg" aria-hidden="true"></i>
            </span>
            <div class="leading-tight">
                <p class="text-sm font-semibold">Grand Hotel Misurina</p>
                <p class="text-xs text-white/60">Admin Dashboard</p>
            </div>
        </div>

        <!-- Nav links: Overview, Bookings, Rooms, Offers, Guests -->
        <nav class="flex-1 space-y-1 px-3 py-6" aria-label="Dashboard sections">
            <button type="button" data-view="overview" class="sidebar-nav-link" aria-current="page">
                <i class="fa-solid fa-chart-pie w-5" aria-hidden="true"></i>
                <span>Overview</span>
            </button>
            <button type="button" data-view="bookings" class="sidebar-nav-link">
                <i class="fa-solid fa-calendar-check w-5" aria-hidden="true"></i>
                <span>Bookings</span>
            </button>
            <button type="button" data-view="rooms" class="sidebar-nav-link">
                <i class="fa-solid fa-bed w-5" aria-hidden="true"></i>
                <span>Rooms</span>
            </button>
            <button type="button" data-view="offers" class="sidebar-nav-link">
                <i class="fa-solid fa-ticket w-5" aria-hidden="true"></i>
                <span>Offers</span>
            </button>
            <button type="button" data-view="guests" class="sidebar-nav-link">
                <i class="fa-solid fa-users w-5" aria-hidden="true"></i>
                <span>Guests</span>
            </button>
        </nav>

        <!-- Footer note / back link to the public site -->
        <div class="border-t border-white/10 px-6 py-5">
            <a href="./index.php" class="flex items-center gap-2 text-xs text-white/60 transition hover:text-sun">
                <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
                Back to public site
            </a>
        </div>
    </aside>

    <!-- Backdrop shown behind the sidebar when it's open on mobile -->
    <div id="sidebar-backdrop" class="fixed inset-0 z-30 hidden bg-ink/40 lg:hidden"></div>

    <!-- MAIN COLUMN (header bar + page content) -->
    <div class="lg:pl-64">

        <!-- TOP HEADER BAR -->
        <header class="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-forest/10 bg-paper/95 px-5 backdrop-blur sm:px-8">
            <div class="flex items-center gap-4">
                <!-- Mobile-only sidebar toggle -->
                <button
                    id="sidebar-toggle"
                    type="button"
                    class="grid size-10 place-items-center rounded-full border border-forest/15 text-forest transition hover:bg-forest hover:text-white lg:hidden"
                    aria-controls="sidebar"
                    aria-expanded="false"
                    aria-label="Open sidebar"
                >
                    <i class="fa-solid fa-bars" aria-hidden="true"></i>
                </button>
                <div>
                    <!-- Updated by switchView() to reflect the active section -->
                    <h1 id="view-title" class="text-xl font-semibold text-forest">Overview</h1>
                    <p class="text-xs text-ink/55">Grand Hotel Misurina &middot; Staff view</p>
                </div>
            </div>

            <div class="flex items-center gap-3">
                <button
                    id="refresh-dashboard"
                    type="button"
                    class="inline-flex min-h-10 items-center gap-2 rounded-full border border-forest/15 px-3 text-sm font-medium text-forest transition hover:bg-forest hover:text-white"
                    aria-label="Refresh dashboard data"
                >
                    <i class="fa-solid fa-rotate" aria-hidden="true"></i>
                    <span class="hidden sm:inline">Refresh</span>
                </button>

                <!-- Notifications for pending booking requests -->
                <div class="relative">
                    <button
                        id="notifications-toggle"
                        type="button"
                        class="relative grid size-10 place-items-center rounded-full border border-forest/15 text-forest transition hover:bg-forest hover:text-white"
                        aria-haspopup="true"
                        aria-expanded="false"
                        aria-label="Notifications"
                    >
                        <i class="fa-solid fa-bell" aria-hidden="true"></i>
                        <span id="notification-count" class="absolute -right-1 -top-1 hidden grid size-4 place-items-center rounded-full bg-clay text-[10px] font-bold text-white"></span>
                    </button>
                    <div id="notifications-panel" class="absolute right-0 z-30 mt-2 hidden w-72 rounded-md border border-forest/10 bg-white p-2 shadow-xl" aria-live="polite">
                        <p class="px-3 py-2 text-xs font-bold uppercase tracking-wide text-ink/50">Notifications</p>
                        <div id="notifications-list"></div>
                    </div>
                </div>

                <!-- Admin profile menu -->
                <div class="relative">
                    <button
                        id="profile-toggle"
                        type="button"
                        class="flex items-center gap-2 rounded-full border border-forest/15 py-1 pl-1 pr-3 transition hover:bg-forest hover:text-white"
                        aria-haspopup="true"
                        aria-expanded="false"
                    >
                        <span id="admin-initials" class="grid size-8 place-items-center rounded-full bg-forest text-xs font-semibold text-white">AD</span>
                        <span id="admin-name" class="hidden text-sm font-medium sm:inline">Administrator</span>
                        <i class="fa-solid fa-chevron-down text-xs" aria-hidden="true"></i>
                    </button>
                    <div id="profile-panel" class="absolute right-0 z-30 mt-2 hidden w-48 rounded-md border border-forest/10 bg-white p-2 shadow-xl">
                        <a href="#" class="block rounded-sm px-3 py-2 text-sm hover:bg-mist">Your profile</a>
                        <a href="#" class="block rounded-sm px-3 py-2 text-sm hover:bg-mist">Settings</a>
                        <button id="admin-logout" type="button" class="block w-full rounded-sm px-3 py-2 text-left text-sm text-clay hover:bg-mist">Log out</button>
                    </div>
                </div>
            </div>
        </header>

        <main class="px-5 py-8 sm:px-8">
            <!-- GLOBAL LOADING SPINNER STATE -->
            <div id="api-loading" class="flex flex-col items-center justify-center py-16">
                <i class="fa-solid fa-spinner animate-spin text-3xl text-forest" aria-hidden="true"></i>
                <p class="mt-3 text-sm font-medium text-ink/60">Connecting to server and loading data...</p>
            </div>

            <!-- GLOBAL ERROR STATE & TRY AGAIN BUTTON -->
            <div id="api-error" class="hidden rounded-md border border-clay/30 bg-clay/10 p-6 text-center">
                <i class="fa-solid fa-triangle-exclamation text-2xl text-clay mb-2" aria-hidden="true"></i>
                <p id="api-error-message" class="text-sm font-semibold text-clay mb-4">Could not connect to the server.</p>
                <button type="button" id="retry-btn" class="rounded-full bg-forest px-5 py-2 text-xs font-semibold text-white transition hover:bg-forest/90">
                    Try Again
                </button>
            </div>

            <!-- OVERVIEW PANEL -->
            <section id="view-overview" class="view-panel space-y-8">
                <div id="kpi-cards" class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"></div>

                <div class="rounded-md border border-forest/10 bg-white p-5 shadow-sm">
                    <div class="mb-4 flex items-center justify-between">
                        <h2 class="text-lg font-semibold text-forest">Recent bookings</h2>
                        <button type="button" data-view-link="bookings" class="text-sm font-semibold text-clay hover:underline">
                            View all <i class="fa-solid fa-arrow-right text-xs" aria-hidden="true"></i>
                        </button>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full min-w-[560px] text-left text-sm">
                            <thead>
                                <tr class="border-b border-forest/10 text-xs uppercase tracking-wide text-ink/50">
                                    <th class="py-2 pr-4 font-semibold">Guest</th>
                                    <th class="py-2 pr-4 font-semibold">Room type</th>
                                    <th class="py-2 pr-4 font-semibold">Check-in</th>
                                    <th class="py-2 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody id="recent-bookings-body"></tbody>
                        </table>
                    </div>
                </div>
            </section>

            <!--  BOOKINGS PANEL -->
            <section id="view-bookings" class="view-panel hidden space-y-5">

                <!-- Status Filters & Search Bar -->
                <div class="flex flex-col gap-4 rounded-md border border-forest/10 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div id="status-filters" class="flex flex-wrap gap-2">
                        <button type="button" class="status-filter-chip" data-status="all" aria-pressed="true">All</button>
                        <button type="button" class="status-filter-chip" data-status="confirmed" aria-pressed="false">Confirmed</button>
                        <button type="button" class="status-filter-chip" data-status="pending" aria-pressed="false">Pending</button>
                        <button type="button" class="status-filter-chip" data-status="checked-in" aria-pressed="false">Checked in</button>
                        <button type="button" class="status-filter-chip" data-status="overdue" aria-pressed="false">Overdue</button>
                        <button type="button" class="status-filter-chip" data-status="checked-out" aria-pressed="false">Checked out</button>
                        <button type="button" class="status-filter-chip" data-status="cancelled" aria-pressed="false">Cancelled</button>
                    </div>

                    <!-- Search bar -->
                    <label class="relative block sm:w-72">
                        <span class="sr-only">Search bookings</span>
                        <i class="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" aria-hidden="true"></i>
                        <input
                            id="booking-search"
                            type="search"
                            placeholder="Search guest ID, name, or email..."
                            class="w-full rounded-full border border-forest/15 bg-paper py-2 pl-9 pr-4 text-sm outline-none transition focus:border-lake focus:ring-2 focus:ring-lake/20"
                        >
                    </label>
                </div>

                <!-- Interactive Bookings Table -->
                <div class="overflow-hidden rounded-md border border-forest/10 bg-white shadow-sm">
                    <div class="overflow-x-auto">
                        <table class="w-full min-w-[760px] text-left text-sm">
                            <thead class="bg-mist/70">
                                <tr class="text-xs uppercase tracking-wide text-ink/55">
                                    <th class="px-5 py-3 font-semibold">Guest name</th>
                                    <th class="px-5 py-3 font-semibold">Room type</th>
                                    <th class="px-5 py-3 font-semibold">Check-in</th>
                                    <th class="px-5 py-3 font-semibold">Check-out</th>
                                    <th class="px-5 py-3 font-semibold">Status</th>
                                    <th class="px-5 py-3 text-right font-semibold">Action</th>
                                </tr>
                            </thead>
                            <tbody id="bookings-table-body" class="divide-y divide-forest/5"></tbody>
                        </table>
                    </div>
                    <p id="bookings-empty-state" class="hidden px-5 py-10 text-center text-sm text-ink/50">
                        No bookings match your search or filter.
                    </p>
                </div>
            </section>

            <!-- ROOMS PANEL -->
            <section id="view-rooms" class="view-panel hidden space-y-5">
                <div class="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 class="text-xl font-semibold text-forest">Room operations</h2>
                        <p class="mt-1 text-sm text-ink/60">Assign rooms from booking details before confirming a stay. Pending requests do not reserve rooms; cancellations remain in booking history.</p>
                    </div>
                    <div class="flex flex-wrap gap-2" role="tablist" aria-label="Room sections">
                        <button type="button" class="room-section-tab rounded-full bg-forest px-4 py-2 text-sm font-semibold text-white" data-room-section="monitoring" aria-selected="true">Monitoring</button>
                        <button type="button" class="room-section-tab rounded-full border border-forest/20 px-4 py-2 text-sm font-semibold text-forest" data-room-section="inventory" aria-selected="false">Room inventory</button>
                        <button type="button" class="room-section-tab rounded-full border border-forest/20 px-4 py-2 text-sm font-semibold text-forest" data-room-section="types" aria-selected="false">Room types</button>
                    </div>
                </div>
                <p id="rooms-feedback" class="hidden rounded-sm border border-lake/30 bg-white p-4 text-sm text-forest" role="status" aria-live="polite"></p>
                <div id="rooms-monitoring-panel" class="room-section-panel overflow-hidden rounded-md border border-forest/10 bg-white shadow-sm">
                    <div class="overflow-x-auto">
                        <table class="w-full min-w-[760px] text-left text-sm">
                            <thead class="bg-mist/70">
                                <tr class="text-xs uppercase tracking-wide text-ink/55">
                                    <th class="px-5 py-3 font-semibold">Room</th>
                                    <th class="px-5 py-3 font-semibold">Type</th>
                                    <th class="px-5 py-3 font-semibold">Floor</th>
                                    <th class="px-5 py-3 font-semibold">Status</th>
                                    <th class="px-5 py-3 font-semibold">Stay / availability</th>
                                    <th class="px-5 py-3 text-right font-semibold">Details</th>
                                </tr>
                            </thead>
                            <tbody id="rooms-table-body" class="divide-y divide-forest/5"></tbody>
                        </table>
                    </div>
                    <p id="rooms-empty-state" class="hidden px-5 py-10 text-center text-sm text-ink/50">No rooms have been added yet. Add rooms in Room inventory.</p>
                </div>
                <div id="rooms-inventory-panel" class="room-section-panel hidden space-y-4">
                    <div class="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 class="text-lg font-semibold text-forest">Physical rooms</h3>
                            <p class="text-sm text-ink/60">Add room numbers, floors, and room types. Rooms with booking history cannot be deleted.</p>
                        </div>
                        <button id="room-create" type="button" class="rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white hover:bg-clay"><i class="fa-solid fa-plus mr-2" aria-hidden="true"></i>Add room</button>
                    </div>
                    <div class="overflow-hidden rounded-md border border-forest/10 bg-white shadow-sm">
                        <div class="overflow-x-auto">
                            <table class="w-full min-w-[700px] text-left text-sm">
                                <thead class="bg-mist/70"><tr class="text-xs uppercase tracking-wide text-ink/55"><th class="px-5 py-3 font-semibold">Room</th><th class="px-5 py-3 font-semibold">Type</th><th class="px-5 py-3 font-semibold">Floor</th><th class="px-5 py-3 font-semibold">Housekeeping</th><th class="px-5 py-3 text-right font-semibold">Actions</th></tr></thead>
                                <tbody id="room-inventory-body" class="divide-y divide-forest/5"></tbody>
                            </table>
                        </div>
                        <p id="room-inventory-empty" class="hidden px-5 py-10 text-center text-sm text-ink/50">No physical rooms yet.</p>
                    </div>
                </div>
                <div id="rooms-types-panel" class="room-section-panel hidden space-y-4">
                    <div class="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 class="text-lg font-semibold text-forest">Room types</h3>
                            <p class="text-sm text-ink/60">Descriptions and photos are shown wherever room types are presented to guests.</p>
                        </div>
                        <button id="room-type-create" type="button" class="rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white hover:bg-clay"><i class="fa-solid fa-plus mr-2" aria-hidden="true"></i>Add room type</button>
                    </div>
                    <div id="room-types-grid" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3"></div>
                    <p id="room-types-empty" class="hidden rounded-md border border-forest/10 bg-white px-5 py-10 text-center text-sm text-ink/50">No room types yet.</p>
                </div>
            </section>

            <!-- OFFERS PANEL -->
            <section id="view-offers" class="view-panel hidden space-y-5">
                <div class="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 class="text-xl font-semibold text-forest">Manage offers</h2>
                        <p class="mt-1 text-sm text-ink/60">Create and schedule promotions shown on the public site.</p>
                    </div>
                    <button id="offer-create" type="button" class="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-clay">
                        <i class="fa-solid fa-plus" aria-hidden="true"></i> Add offer
                    </button>
                </div>
                <p id="offers-feedback" class="hidden rounded-sm border border-lake/30 bg-white p-4 text-sm text-forest" role="status" aria-live="polite"></p>
                <div class="overflow-hidden rounded-md border border-forest/10 bg-white shadow-sm">
                    <div class="overflow-x-auto">
                        <table class="w-full min-w-[760px] text-left text-sm">
                            <thead class="bg-mist/70">
                                <tr class="text-xs uppercase tracking-wide text-ink/55">
                                    <th class="px-5 py-3 font-semibold">Offer</th>
                                    <th class="px-5 py-3 font-semibold">Discount</th>
                                    <th class="px-5 py-3 font-semibold">Schedule</th>
                                    <th class="px-5 py-3 font-semibold">Status</th>
                                    <th class="px-5 py-3 text-right font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="offers-table-body" class="divide-y divide-forest/5"></tbody>
                        </table>
                    </div>
                    <p id="offers-empty-state" class="hidden px-5 py-10 text-center text-sm text-ink/50">No offers yet. Add one to show promotions on the public site.</p>
                </div>
            </section>

            <!-- GUESTS PANEL -->
            <section id="view-guests" class="view-panel hidden space-y-5">
                <div class="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 class="text-xl font-semibold text-forest">Guest accounts</h2>
                        <p class="mt-1 text-sm text-ink/60">Manage guest contact details and account access. Deactivation preserves booking history.</p>
                    </div>
                    <button id="guest-create" type="button" class="rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white hover:bg-clay"><i class="fa-solid fa-plus mr-2" aria-hidden="true"></i>Add guest</button>
                </div>
                <p id="guests-feedback" class="hidden rounded-sm border border-lake/30 bg-white p-4 text-sm text-forest" role="status" aria-live="polite"></p>
                <div class="overflow-hidden rounded-md border border-forest/10 bg-white shadow-sm">
                    <div class="overflow-x-auto">
                        <table class="w-full min-w-[820px] text-left text-sm">
                            <thead class="bg-mist/70">
                                <tr class="text-xs uppercase tracking-wide text-ink/55">
                                    <th class="px-5 py-3 font-semibold">Guest ID</th>
                                    <th class="px-5 py-3 font-semibold">Guest</th>
                                    <th class="px-5 py-3 font-semibold">Email</th>
                                    <th class="px-5 py-3 font-semibold">Total bookings</th>
                                    <th class="px-5 py-3 font-semibold">Last stay</th>
                                    <th class="px-5 py-3 font-semibold">Account</th>
                                    <th class="px-5 py-3 text-right font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="guests-table-body" class="divide-y divide-forest/5"></tbody>
                        </table>
                    </div>
                    <p id="guests-empty-state" class="hidden px-5 py-10 text-center text-sm text-ink/50">No guest accounts yet.</p>
                </div>
            </section>
        </main>
    </div>

    <dialog id="offer-modal" class="dashboard-dialog w-[min(92vw,38rem)] rounded-md bg-white p-0 shadow-2xl backdrop:bg-ink/60" aria-labelledby="offer-modal-title">
        <form id="offer-form" class="grid gap-5 p-6 sm:p-8">
            <div>
                <p class="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-clay">Public promotion</p>
                <h2 id="offer-modal-title" class="text-2xl font-semibold text-forest">Add offer</h2>
            </div>
            <input type="hidden" name="id">
            <div class="grid gap-4 sm:grid-cols-2">
                <label class="grid gap-2 text-sm font-semibold text-ink sm:col-span-2">Title
                    <input name="title" maxlength="100" required class="min-h-11 rounded-sm border border-forest/20 bg-paper px-3 font-normal outline-none focus:border-lake focus:ring-2 focus:ring-lake/20">
                </label>
                <label class="grid gap-2 text-sm font-semibold text-ink sm:col-span-2">Description
                    <textarea name="description" maxlength="500" rows="3" required class="rounded-sm border border-forest/20 bg-paper px-3 py-2 font-normal outline-none focus:border-lake focus:ring-2 focus:ring-lake/20"></textarea>
                </label>
                <label class="grid gap-2 text-sm font-semibold text-ink">Discount type
                    <select name="discountType" required class="min-h-11 rounded-sm border border-forest/20 bg-paper px-3 font-normal">
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed amount (USD)</option>
                    </select>
                </label>
                <label class="grid gap-2 text-sm font-semibold text-ink">Discount value
                    <input name="discountValue" type="number" min="1" step="0.01" required class="min-h-11 rounded-sm border border-forest/20 bg-paper px-3 font-normal">
                </label>
                <label class="grid gap-2 text-sm font-semibold text-ink">Start date
                    <input name="startDate" type="date" required class="min-h-11 rounded-sm border border-forest/20 bg-paper px-3 font-normal">
                </label>
                <label class="grid gap-2 text-sm font-semibold text-ink">End date
                    <input name="endDate" type="date" required class="min-h-11 rounded-sm border border-forest/20 bg-paper px-3 font-normal">
                </label>
                <div class="grid gap-2 text-sm font-semibold text-ink sm:col-span-2">
                    <label for="offer-photo">Offer photo (optional)</label>
                    <input id="offer-photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" class="min-h-11 rounded-sm border border-forest/20 bg-paper px-3 py-2 font-normal">
                    <input name="imagePath" type="hidden">
                    <div class="flex items-center justify-between gap-3">
                        <span id="offer-photo-name" class="truncate text-xs font-normal text-ink/55">No photo selected.</span>
                        <button id="offer-photo-remove" type="button" class="hidden shrink-0 text-xs font-semibold text-clay underline">Remove photo</button>
                    </div>
                    <span class="text-xs font-normal text-ink/55">JPEG, PNG, or WebP · maximum 5 MB. Photo saved in the project Assets folder.</span>
                </div>
                <label class="flex items-center gap-3 text-sm font-medium text-ink sm:col-span-2">
                    <input name="active" type="checkbox" class="size-4 accent-forest">
                    Active during the scheduled dates
                </label>
            </div>
            <p id="offer-form-error" class="hidden rounded-sm border border-clay/30 bg-clay/10 p-3 text-sm text-clay" role="alert"></p>
            <div class="flex justify-end gap-3 border-t border-forest/10 pt-4">
                <button id="offer-cancel" type="button" class="rounded-full border border-forest/20 px-5 py-2.5 text-sm font-semibold text-ink hover:bg-mist">Cancel</button>
                <button id="offer-save" type="submit" class="rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white hover:bg-clay">Save offer</button>
            </div>
        </form>
    </dialog>

    <dialog id="room-modal" class="dashboard-dialog w-[min(92vw,34rem)] rounded-md bg-white p-0 shadow-2xl backdrop:bg-ink/60" aria-labelledby="room-modal-title">
        <form id="room-form" class="grid gap-5 p-6 sm:p-8">
            <div><p class="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-clay">Physical room</p><h2 id="room-modal-title" class="text-2xl font-semibold text-forest">Add room</h2></div>
            <input type="hidden" name="id">
            <label class="grid gap-2 text-sm font-semibold text-ink">Room number<input name="roomNumber" maxlength="12" required pattern="[A-Za-z0-9\-]+" class="min-h-11 rounded-sm border border-forest/20 bg-paper px-3 font-normal"></label>
            <div class="grid gap-4 sm:grid-cols-2">
                <label class="grid gap-2 text-sm font-semibold text-ink">Room type<select name="roomTypeId" required class="min-h-11 rounded-sm border border-forest/20 bg-paper px-3 font-normal"></select></label>
                <label class="grid gap-2 text-sm font-semibold text-ink">Floor<input name="floor" type="number" min="0" max="100" step="1" required class="min-h-11 rounded-sm border border-forest/20 bg-paper px-3 font-normal"></label>
            </div>
            <label class="flex items-center gap-3 text-sm font-medium text-ink"><input name="maintenance" type="checkbox" class="size-4 accent-forest"> Mark as under maintenance</label>
            <p id="room-form-error" class="hidden rounded-sm border border-clay/30 bg-clay/10 p-3 text-sm text-clay" role="alert"></p>
            <div class="flex justify-end gap-3 border-t border-forest/10 pt-4"><button type="button" id="room-cancel" class="rounded-full border border-forest/20 px-5 py-2.5 text-sm font-semibold text-ink hover:bg-mist">Cancel</button><button id="room-save" type="submit" class="rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white hover:bg-clay">Save room</button></div>
        </form>
    </dialog>

    <dialog id="room-type-modal" class="dashboard-dialog w-[min(92vw,42rem)] rounded-md bg-white p-0 shadow-2xl backdrop:bg-ink/60" aria-labelledby="room-type-modal-title">
        <form id="room-type-form" class="grid gap-5 p-6 sm:p-8">
            <div><p class="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-clay">Guest-facing details</p><h2 id="room-type-modal-title" class="text-2xl font-semibold text-forest">Add room type</h2></div>
            <input type="hidden" name="id">
            <label class="grid gap-2 text-sm font-semibold text-ink">Name<input name="name" maxlength="80" required class="min-h-11 rounded-sm border border-forest/20 bg-paper px-3 font-normal"></label>
            <label class="grid gap-2 text-sm font-semibold text-ink">Description<textarea name="description" maxlength="1000" rows="4" required class="rounded-sm border border-forest/20 bg-paper px-3 py-2 font-normal"></textarea></label>
            <div class="grid gap-4 sm:grid-cols-2">
                <label class="grid gap-2 text-sm font-semibold text-ink">Rate per night (USD)<input name="ratePerNight" type="number" min="0" step="0.01" required class="min-h-11 rounded-sm border border-forest/20 bg-paper px-3 font-normal"></label>
                <label class="grid gap-2 text-sm font-semibold text-ink">Maximum guests<input name="capacity" type="number" min="1" max="20" step="1" required class="min-h-11 rounded-sm border border-forest/20 bg-paper px-3 font-normal"></label>
            </div>
            <fieldset class="grid gap-4 rounded-sm border border-forest/10 p-4">
                <legend class="px-2 text-sm font-semibold text-forest">Room features</legend>
                <div class="grid gap-4 sm:grid-cols-2">
                    <label class="grid gap-2 text-sm font-semibold text-ink">Bed type
                        <select name="bedType" required class="min-h-11 rounded-sm border border-forest/20 bg-paper px-3 font-normal">
                            <option value="King">King</option><option value="Queen">Queen</option><option value="Double">Double</option><option value="Twin">Twin</option><option value="Single">Single</option>
                        </select>
                    </label>
                    <label class="grid gap-2 text-sm font-semibold text-ink">Smoking policy
                        <select name="smokingAllowed" required class="min-h-11 rounded-sm border border-forest/20 bg-paper px-3 font-normal">
                            <option value="false">Non-smoking</option><option value="true">Smoking allowed</option>
                        </select>
                    </label>
                    <label class="grid gap-2 text-sm font-semibold text-ink sm:col-span-2">Meal plan
                        <select name="mealPlan" required class="min-h-11 rounded-sm border border-forest/20 bg-paper px-3 font-normal">
                            <option value="No meals">No meals included</option><option value="Breakfast">Breakfast included</option><option value="Breakfast and dinner">Breakfast and dinner included</option>
                        </select>
                    </label>
                </div>
                <div class="grid gap-3 sm:grid-cols-2">
                    <label class="flex items-center gap-3 text-sm font-medium text-ink"><input name="sofa" type="checkbox" class="size-4 accent-forest"> Sofa / sitting area</label>
                    <label class="flex items-center gap-3 text-sm font-medium text-ink"><input name="amenities" type="checkbox" value="Wi-Fi" class="size-4 accent-forest"> Wi-Fi</label>
                    <label class="flex items-center gap-3 text-sm font-medium text-ink"><input name="amenities" type="checkbox" value="Balcony" class="size-4 accent-forest"> Balcony</label>
                    <label class="flex items-center gap-3 text-sm font-medium text-ink"><input name="amenities" type="checkbox" value="Lake view" class="size-4 accent-forest"> Lake view</label>
                    <label class="flex items-center gap-3 text-sm font-medium text-ink"><input name="amenities" type="checkbox" value="Mini bar" class="size-4 accent-forest"> Mini bar</label>
                    <label class="flex items-center gap-3 text-sm font-medium text-ink"><input name="amenities" type="checkbox" value="Air conditioning" class="size-4 accent-forest"> Air conditioning</label>
                </div>
            </fieldset>
            <div class="grid gap-2 text-sm font-semibold text-ink">
                <label for="room-type-photo">Room photo (optional)</label>
                <input id="room-type-photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" class="min-h-11 rounded-sm border border-forest/20 bg-paper px-3 py-2 font-normal">
                <span class="text-xs font-normal text-ink/55">JPEG, PNG, or WebP · maximum 5 MB. The image will be saved in the project Assets folder.</span>
                <input name="imagePath" type="hidden">
                <div id="room-type-photo-preview" class="hidden overflow-hidden rounded-sm border border-forest/10">
                    <img class="max-h-56 w-full object-cover" alt="Room type photo preview">
                    <div class="flex items-center justify-between gap-3 bg-paper px-3 py-2">
                        <span id="room-type-photo-name" class="truncate text-xs font-normal text-ink/65"></span>
                        <button id="room-type-photo-remove" type="button" class="shrink-0 text-xs font-semibold text-clay underline">Remove photo</button>
                    </div>
                </div>
            </div>
            <p id="room-type-form-error" class="hidden rounded-sm border border-clay/30 bg-clay/10 p-3 text-sm text-clay" role="alert"></p>
            <div class="flex justify-end gap-3 border-t border-forest/10 pt-4"><button type="button" id="room-type-cancel" class="rounded-full border border-forest/20 px-5 py-2.5 text-sm font-semibold text-ink hover:bg-mist">Cancel</button><button id="room-type-save" type="submit" class="rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white hover:bg-clay">Save room type</button></div>
        </form>
    </dialog>

    <dialog id="guest-modal" class="dashboard-dialog w-[min(92vw,38rem)] rounded-md bg-white p-0 shadow-2xl backdrop:bg-ink/60" aria-labelledby="guest-modal-title">
        <form id="guest-form" class="grid gap-5 p-6 sm:p-8">
            <div><p class="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-clay">Guest account</p><h2 id="guest-modal-title" class="text-2xl font-semibold text-forest">Add guest</h2></div>
            <input type="hidden" name="id">
            <div class="grid gap-4 sm:grid-cols-2">
                <label class="grid gap-2 text-sm font-semibold text-ink">Full name<input name="name" maxlength="100" required class="min-h-11 rounded-sm border border-forest/20 bg-paper px-3 font-normal"></label>
                <label class="grid gap-2 text-sm font-semibold text-ink">Email<input name="email" type="email" maxlength="254" required class="min-h-11 rounded-sm border border-forest/20 bg-paper px-3 font-normal"></label>
                <label class="grid gap-2 text-sm font-semibold text-ink">Phone (international format)<input name="phone" type="tel" maxlength="20" required placeholder="+628123456789" class="min-h-11 rounded-sm border border-forest/20 bg-paper px-3 font-normal"></label>
                <label class="grid gap-2 text-sm font-semibold text-ink">Country<input name="country" maxlength="80" required class="min-h-11 rounded-sm border border-forest/20 bg-paper px-3 font-normal"></label>
                <label id="guest-password-field" class="grid gap-2 text-sm font-semibold text-ink sm:col-span-2">Temporary password<input name="password" type="password" minlength="8" autocomplete="new-password" class="min-h-11 rounded-sm border border-forest/20 bg-paper px-3 font-normal"><span class="text-xs font-normal text-ink/55">At least 8 characters and include a number. Ask the guest to change it after signing in.</span></label>
            </div>
            <p id="guest-form-error" class="hidden rounded-sm border border-clay/30 bg-clay/10 p-3 text-sm text-clay" role="alert"></p>
            <div class="flex justify-end gap-3 border-t border-forest/10 pt-4"><button type="button" id="guest-cancel" class="rounded-full border border-forest/20 px-5 py-2.5 text-sm font-semibold text-ink hover:bg-mist">Cancel</button><button id="guest-save" type="submit" class="rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white hover:bg-clay">Save guest</button></div>
        </form>
    </dialog>

    <dialog id="room-details-modal" class="dashboard-dialog w-[min(92vw,38rem)] rounded-md bg-white p-0 shadow-2xl backdrop:bg-ink/60" aria-labelledby="room-details-title">
        <div class="grid gap-5 p-6 sm:p-8">
            <div class="flex items-start justify-between"><div><p class="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-clay">Room stay</p><h2 id="room-details-title" class="text-2xl font-semibold text-forest"></h2></div><button type="button" id="room-details-close" class="grid size-9 place-items-center rounded-full text-ink/50 hover:bg-mist" aria-label="Close room details"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div>
            <div id="room-details-content" class="grid gap-3 text-sm"></div>
        </div>
    </dialog>

    <!-- BOOKING DETAILS MODAL -->
    <div id="booking-modal" class="fixed inset-0 z-50 hidden items-center justify-center bg-ink/50 p-4">
        <div class="w-full max-w-lg rounded-md bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div class="mb-5 flex items-start justify-between">
                <h2 id="modal-title" class="text-lg font-semibold text-forest">Booking details</h2>
                <button id="modal-close" type="button" class="grid size-8 place-items-center rounded-full text-ink/50 transition hover:bg-mist hover:text-ink" aria-label="Close">
                    <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                </button>
            </div>

            <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                    <dt class="text-xs uppercase tracking-wide text-ink/50">Guest</dt>
                    <dd id="modal-guest-name" class="font-medium text-ink"></dd>
                </div>
                <div>
                    <dt class="text-xs uppercase tracking-wide text-ink/50">Email</dt>
                    <dd id="modal-guest-email" class="font-medium text-ink"></dd>
                </div>
                <div>
                    <dt class="text-xs uppercase tracking-wide text-ink/50">Room type</dt>
                    <dd id="modal-room-type" class="font-medium text-ink"></dd>
                </div>
                <div>
                    <dt class="text-xs uppercase tracking-wide text-ink/50">Assigned room</dt>
                    <dd id="modal-assigned-room" class="font-medium text-ink"></dd>
                </div>
                <div>
                    <dt class="text-xs uppercase tracking-wide text-ink/50">Guests</dt>
                    <dd id="modal-guest-count" class="font-medium text-ink"></dd>
                </div>
                <div>
                    <dt class="text-xs uppercase tracking-wide text-ink/50">Check-in</dt>
                    <dd id="modal-check-in" class="font-medium text-ink"></dd>
                </div>
                <div>
                    <dt class="text-xs uppercase tracking-wide text-ink/50">Check-out</dt>
                    <dd id="modal-check-out" class="font-medium text-ink"></dd>
                </div>
                <div class="col-span-2">
                    <dt class="text-xs uppercase tracking-wide text-ink/50">Total amount</dt>
                    <dd id="modal-total" class="font-medium text-ink"></dd>
                </div>
                <div class="col-span-2">
                    <dt class="mb-1 text-xs uppercase tracking-wide text-ink/50">Offer applied</dt>
                    <select id="modal-offer-select" class="w-full rounded-sm border border-forest/20 bg-paper px-3 py-2 text-sm outline-none focus:border-lake focus:ring-2 focus:ring-lake/20"></select>
                    <p id="modal-offer-total" class="mt-1 text-xs text-ink/55"></p>
                </div>
                <div class="col-span-2">
                    <dt class="mb-1 text-xs uppercase tracking-wide text-ink/50">Special requests</dt>
                    <dd id="modal-requests" class="text-ink/75"></dd>
                </div>
            </dl>

            <!-- The one editable field: booking status -->
            <div class="mt-5">
                <label class="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink/50" for="modal-room-select">Assign physical room</label>
                <select id="modal-room-select" class="w-full rounded-sm border border-forest/20 bg-paper px-3 py-2 text-sm outline-none focus:border-lake focus:ring-2 focus:ring-lake/20"></select>
            </div>
            <div class="mt-5">
                <label class="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink/50" for="modal-status-select">Status</label>
                <select id="modal-status-select" class="w-full rounded-sm border border-forest/20 bg-paper px-3 py-2 text-sm outline-none focus:border-lake focus:ring-2 focus:ring-lake/20">
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="checked-in">Checked in</option>
                    <option value="checked-out">Checked out</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            <div class="mt-6 flex justify-end gap-3">
                <button id="modal-cancel" type="button" class="rounded-full border border-forest/20 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-mist">
                    Cancel
                </button>
                <button id="modal-save" type="button" class="rounded-full bg-forest px-4 py-2 text-sm font-semibold text-white transition hover:bg-clay">
                    Save changes
                </button>
            </div>
        </div>
    </div>

    <script src="./JS/dashboardAdmin.js"></script>
</body>
</html>