<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>My Profile | Grand Hotel Misurina</title>
		<meta name="description" content="Manage your Grand Hotel Misurina guest profile, bookings, and security settings.">
		<link rel="stylesheet" href="./CSS/output.css">
		<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css">
	</head>
	<body class="bg-paper font-sans text-ink antialiased">
		<!-- Shared site navigation -->
		<nav class="fixed inset-x-0 top-0 z-50 h-20 bg-forest transition-all duration-300">
			<div class="container mx-auto flex h-full w-[min(90%,1280px)] items-center justify-between">
				<a class="nav-brand font-display text-lg font-semibold text-white sm:text-xl" href="./index.php#Home">
					<h4>Grand Hotel Misurina</h4>
				</a>
				<ul class="nav_menu invisible pointer-events-none absolute right-0 top-[calc(100%+0.75rem)] z-20 flex w-[min(20rem,calc(100vw-2rem))] translate-y-2 flex-col gap-1 rounded-md border border-white/10 bg-forest p-2 opacity-0 shadow-2xl transition-all duration-200 md:visible md:pointer-events-auto md:static md:w-auto md:translate-y-0 md:flex-row md:items-center md:gap-6 md:border-0 md:bg-transparent md:p-0 md:opacity-100 md:shadow-none" id="primary-navigation">
					<li><a class="nav-link block px-4 py-3 text-sm text-white/85 transition md:px-0 md:py-2" href="./index.php#Home">Explore Hotels</a></li>
					<li><a class="nav-link block px-4 py-3 text-sm text-white/85 transition md:px-0 md:py-2" href="./index.php#About">Our Story</a></li>
					<li><a class="nav-link block px-4 py-3 text-sm text-white/85 transition md:px-0 md:py-2" href="./index.php#Deals">Deals &amp; Offers</a></li>
					<li><a class="nav-link block px-4 py-3 text-sm text-white/85 transition md:px-0 md:py-2" href="./index.php#Destinations">Destinations</a></li>
					<li><a class="nav-auth-login" href="./login.php#login"><span>Log in</span><i class="fa-solid fa-arrow-right-to-bracket" aria-hidden="true"></i></a></li>
				</ul>
				<button class="nav_toggle grid size-11 place-items-center rounded-full border border-white/30 bg-white/10 text-white transition hover:bg-white hover:text-forest focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sun md:hidden" type="button" aria-controls="primary-navigation" aria-expanded="false" aria-label="Open navigation">
					<i class="fa-solid fa-bars" aria-hidden="true"></i>
				</button>
			</div>
		</nav>

		<main class="min-h-svh pt-20" aria-label="User profile">
			<!-- Profile header -->
			<section class="profile-banner py-16 text-white sm:py-24">
				<div class="container mx-auto flex w-[min(90%,1120px)] flex-col gap-8 md:flex-row md:items-center md:justify-between">
					<div class="flex items-center gap-5">
						<span class="grid size-20 shrink-0 place-items-center rounded-full bg-forest font-display text-2xl font-semibold text-white ring-4 ring-white/70 sm:size-24 sm:text-3xl" id="profile-avatar" aria-hidden="true">…</span>
						<div>
							<p class="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-sun">Your account</p>
							<h1 class="font-display text-3xl font-semibold leading-tight text-white sm:text-4xl" id="profile-name">Loading…</h1>
							<p class="mt-1 text-sm text-white/80" id="profile-email">Loading…</p>
							<p class="mt-2 inline-flex items-center gap-2 rounded-full bg-sun/25 px-3 py-1 text-xs font-semibold text-[#7a5a1e]"><i class="fa-solid fa-mountain" aria-hidden="true"></i><span id="profile-member-since">Loading membership date…</span></p>
						</div>
					</div>
					<dl class="grid grid-cols-3 gap-3 text-center sm:gap-4">
						<div class="rounded-md bg-white px-4 py-3 shadow-sm sm:px-6">
							<dt class="text-[11px] font-semibold uppercase tracking-wide text-ink/50">Bookings</dt>
							<dd class="mt-1 text-2xl font-semibold text-forest" id="stat-stays">—</dd>
						</div>
						<div class="rounded-md bg-white px-4 py-3 shadow-sm sm:px-6">
							<dt class="text-[11px] font-semibold uppercase tracking-wide text-ink/50">Upcoming</dt>
							<dd class="mt-1 text-2xl font-semibold text-forest" id="stat-upcoming">—</dd>
						</div>
						<div class="rounded-md bg-white px-4 py-3 shadow-sm sm:px-6">
							<dt class="text-[11px] font-semibold uppercase tracking-wide text-ink/50">Nights stayed</dt>
							<dd class="mt-1 text-2xl font-semibold text-forest" id="stat-nights">—</dd>
						</div>
					</dl>
				</div>
			</section>

			<!-- Tabs and panels -->
			<section class="py-12 sm:py-16">
				<div class="container mx-auto grid w-[min(90%,1120px)] gap-10 lg:grid-cols-[0.55fr_1.45fr] lg:gap-14">
					<aside>
						<div class="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible" role="tablist" aria-label="Profile sections" aria-orientation="vertical">
							<button class="profile-tab" type="button" role="tab" id="tab-info" aria-controls="panel-info" aria-selected="true" data-tab="info"><i class="fa-regular fa-user w-5" aria-hidden="true"></i><span>Personal info</span></button>
							<button class="profile-tab" type="button" role="tab" id="tab-bookings" aria-controls="panel-bookings" aria-selected="false" data-tab="bookings" tabindex="-1"><i class="fa-regular fa-calendar-check w-5" aria-hidden="true"></i><span>My bookings</span></button>
							<button class="profile-tab" type="button" role="tab" id="tab-security" aria-controls="panel-security" aria-selected="false" data-tab="security" tabindex="-1"><i class="fa-solid fa-lock w-5" aria-hidden="true"></i><span>Security</span></button>
						</div>
						<a class="mt-6 hidden items-center gap-2 text-sm font-semibold text-clay underline decoration-clay underline-offset-4 transition hover:text-forest lg:inline-flex" href="./BookOrder.php"><i class="fa-solid fa-location-arrow" aria-hidden="true"></i> Plan a new stay</a>
					</aside>

					<div>
						<!-- Personal info -->
						<div id="panel-info" role="tabpanel" aria-labelledby="tab-info">
							<div class="mb-7 flex flex-wrap items-center justify-between gap-4">
								<h2 class="font-display text-3xl font-semibold text-forest">Personal info</h2>
								<button class="inline-flex items-center gap-2 rounded-full border border-forest/20 px-5 py-2.5 text-sm font-semibold text-forest transition hover:bg-forest hover:text-white" type="button" id="profile-edit-open"><i class="fa-solid fa-pen" aria-hidden="true"></i> Edit details</button>
							</div>
							<dl class="grid gap-5 rounded-md border border-forest/10 bg-white p-6 shadow-sm sm:grid-cols-2">
								<div><dt class="text-xs font-semibold uppercase tracking-wide text-ink/50">Full name</dt><dd class="mt-1 font-medium text-forest" id="profile-detail-name">Loading…</dd></div>
								<div><dt class="text-xs font-semibold uppercase tracking-wide text-ink/50">Email address</dt><dd class="mt-1 break-all font-medium text-forest" id="profile-detail-email">Loading…</dd></div>
								<div><dt class="text-xs font-semibold uppercase tracking-wide text-ink/50">Phone</dt><dd class="mt-1 font-medium text-forest" id="profile-detail-phone">Loading…</dd></div>
								<div><dt class="text-xs font-semibold uppercase tracking-wide text-ink/50">Country</dt><dd class="mt-1 font-medium text-forest" id="profile-detail-country">Loading…</dd></div>
							</dl>
							<p class="mt-4 hidden rounded-sm border border-lake/30 bg-mist p-4 text-sm leading-6 text-forest" id="profile-status" role="status" aria-live="polite"></p>
						</div>

						<!-- Bookings -->
						<div id="panel-bookings" role="tabpanel" aria-labelledby="tab-bookings" hidden>
							<div class="mb-7 flex flex-wrap items-end justify-between gap-3">
								<h2 class="font-display text-3xl font-semibold text-forest">My bookings</h2>
								<a class="text-sm font-semibold text-clay underline decoration-clay underline-offset-4 transition hover:text-forest" href="./BookOrder.php">New request</a>
							</div>
							<ul class="grid gap-4" id="bookings-list"></ul>
							<p class="hidden rounded-sm border border-forest/10 bg-mist p-6 text-center text-sm text-ink/70" id="bookings-empty">No booking records are linked to this account yet.</p>
						</div>

						<!-- Security -->
						<div id="panel-security" role="tabpanel" aria-labelledby="tab-security" hidden>
							<h2 class="mb-7 font-display text-3xl font-semibold text-forest">Security</h2>
							<div class="grid max-w-lg gap-5">
								<div class="rounded-md border border-forest/10 bg-white p-6 shadow-sm">
									<h3 class="font-semibold text-forest">Change password</h3>
									<p class="mt-2 text-sm leading-6 text-ink/70">Update your password using the password reset page. You’ll need to log in again afterward.</p>
									<button class="mt-4 inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-clay" type="button" id="profile-password-open"><i class="fa-solid fa-key" aria-hidden="true"></i> Change password</button>
								</div>
								<div class="rounded-md border border-clay/20 bg-white p-6 shadow-sm">
									<h3 class="font-semibold text-forest">Log out</h3>
									<p class="mt-2 text-sm leading-6 text-ink/70">End your guest session on this device.</p>
									<button class="mt-4 inline-flex items-center gap-2 rounded-full border border-clay px-5 py-2.5 text-sm font-semibold text-clay transition hover:bg-clay hover:text-white" type="button" id="profile-logout-open"><i class="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i> Log out</button>
								</div>
							</div>
						</div>

					</div>
				</div>
			</section>
		</main>

		<!-- Edit profile details -->
		<dialog class="profile-dialog w-[min(92vw,36rem)] rounded-md bg-white p-0 shadow-2xl backdrop:bg-ink/60" id="profile-edit-dialog" aria-labelledby="profile-edit-title">
			<form class="grid gap-5 p-6 sm:p-8" id="profile-edit-form">
				<div>
					<p class="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-clay">Account details</p>
					<h2 class="font-display text-2xl font-semibold text-forest" id="profile-edit-title">Edit personal info</h2>
				</div>
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="grid gap-2">
						<label class="text-sm font-semibold text-ink" for="profile-input-name">Full name</label>
						<input class="min-h-12 rounded-sm border border-forest/20 bg-paper px-4 text-ink outline-none focus:border-lake focus:ring-2 focus:ring-lake/20" id="profile-input-name" name="name" maxlength="100" autocomplete="name" required>
					</div>
					<div class="grid gap-2">
						<label class="text-sm font-semibold text-ink" for="profile-input-email">Email address</label>
						<input class="min-h-12 rounded-sm border border-forest/20 bg-paper px-4 text-ink outline-none focus:border-lake focus:ring-2 focus:ring-lake/20" id="profile-input-email" name="email" type="email" maxlength="254" autocomplete="email" required>
					</div>
					<div class="grid gap-2">
						<label class="text-sm font-semibold text-ink" for="profile-input-phone">Phone (include country code)</label>
						<input class="min-h-12 rounded-sm border border-forest/20 bg-paper px-4 text-ink outline-none focus:border-lake focus:ring-2 focus:ring-lake/20" id="profile-input-phone" name="phone" type="tel" autocomplete="tel" placeholder="+1 555 123 4567" required>
					</div>
					<div class="grid gap-2">
						<label class="text-sm font-semibold text-ink" for="profile-input-country">Country</label>
						<input class="min-h-12 rounded-sm border border-forest/20 bg-paper px-4 text-ink outline-none focus:border-lake focus:ring-2 focus:ring-lake/20" id="profile-input-country" name="country" type="search" list="profile-country-options" autocomplete="country-name" required>
						<datalist id="profile-country-options"></datalist>
						<input id="profile-country-code" name="countryCode" type="hidden">
					</div>
				</div>
				<p class="hidden rounded-sm border border-clay/30 bg-clay/10 p-4 text-sm leading-6 text-clay" id="profile-edit-status" role="status" aria-live="polite"></p>
				<div class="flex flex-wrap justify-end gap-3 border-t border-forest/10 pt-5">
					<button class="rounded-full border border-forest/20 px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-mist" type="button" id="profile-edit-cancel">Cancel</button>
					<button class="rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-clay" type="submit" id="profile-edit-save">Save changes</button>
				</div>
			</form>
		</dialog>

		<!-- Confirm sign out -->
		<dialog class="profile-dialog w-[min(92vw,28rem)] rounded-md bg-white p-0 shadow-2xl backdrop:bg-ink/60" id="logout-dialog" aria-labelledby="logout-dialog-title">
			<div class="grid gap-5 p-6 sm:p-8">
				<div>
					<p class="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-clay">Confirm sign out</p>
					<h2 class="font-display text-2xl font-semibold text-forest" id="logout-dialog-title">Log out of your account?</h2>
					<p class="mt-3 text-sm leading-6 text-ink/70">You’ll need to log in again to access your profile and bookings.</p>
				</div>
				<p class="hidden rounded-sm border border-clay/30 bg-clay/10 p-4 text-sm leading-6 text-clay" id="logout-status" role="status" aria-live="polite"></p>
				<div class="flex justify-end gap-3 border-t border-forest/10 pt-5">
					<button class="rounded-full border border-forest/20 px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-mist" type="button" id="logout-cancel">Stay logged in</button>
					<button class="rounded-full bg-clay px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-forest" type="button" id="logout-confirm">Log out</button>
				</div>
			</div>
		</dialog>

		<!-- Confirm password reset and explain that a fresh login is required -->
		<dialog class="profile-dialog w-[min(92vw,28rem)] rounded-md bg-white p-0 shadow-2xl backdrop:bg-ink/60" id="password-warning-dialog" aria-labelledby="password-warning-title">
			<div class="grid gap-5 p-6 sm:p-8">
				<div>
					<p class="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-clay">Password change</p>
					<h2 class="font-display text-2xl font-semibold text-forest" id="password-warning-title">Continue to password reset?</h2>
					<p class="mt-3 text-sm leading-6 text-ink/70">You’ll continue to the password reset page. After changing your password, you’ll be signed out and must log in again. This demo reset does not verify email ownership.</p>
				</div>
				<div class="flex justify-end gap-3 border-t border-forest/10 pt-5">
					<button class="rounded-full border border-forest/20 px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-mist" type="button" id="password-warning-cancel">Cancel</button>
					<button class="rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-clay" type="button" id="password-warning-confirm">Continue</button>
				</div>
			</div>
		</dialog>

		<!-- Hotel contact information and location -->
		<footer class="bg-forest py-12 text-white sm:py-14">
			<div class="container mx-auto grid w-[min(90%,1280px)] gap-9 md:grid-cols-[1fr_0.9fr_1.2fr] md:gap-12">
				<div>
					<h2 class="mb-3 font-display text-2xl font-semibold">Grand Hotel Misurina</h2>
					<p class="max-w-xs leading-7 text-white/70">Where the lake meets the peaks, a quieter kind of escape begins.</p>
				</div>
				<div>
					<p class="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-sun">Contact</p>
					<h3 class="font-semibold">Elena Rossi</h3>
					<p class="mt-1 text-sm text-white/70">Guest Relations <span class="mt-1 block text-xs">Sample contact</span></p>
					<a class="mt-4 inline-block border-b border-white/40 pb-1 text-sm transition hover:border-sun hover:text-sun" href="mailto:hello@example.com">hello@example.com</a>
				</div>
				<div>
					<p class="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-sun">Find us</p>
					<address class="mb-4 text-sm not-italic leading-6 text-white/70">Via Monte Piana, 21<br>32041 Misurina (Auronzo di Cadore), Belluno, Italy</address>
					<iframe
						class="h-48 w-full rounded-sm bg-mist"
						title="Map showing Grand Hotel Misurina at Via Monte Piana 21"
						src="https://www.openstreetmap.org/export/embed.html?bbox=12.2436311%2C46.5794138%2C12.2636311%2C46.5894138&amp;layer=mapnik&amp;marker=46.5844138%2C12.2536311"
						loading="lazy">
					</iframe>
					<a class="mt-3 inline-block border-b border-white/40 pb-1 text-xs transition hover:border-sun hover:text-sun" href="https://www.openstreetmap.org/?mlat=46.5844138&amp;mlon=12.2536311#map=16/46.5844138/12.2536311" target="_blank" rel="noreferrer">Open in OpenStreetMap</a>
				</div>
			</div>
			<div class="container mx-auto mt-10 flex w-[min(90%,1280px)] flex-col gap-2 border-t border-white/15 pt-5 text-xs text-white/60 sm:flex-row sm:justify-between">
				<p>Student project for educational purposes. Not affiliated with or endorsed by Grand Hotel Misurina.</p>
				<p>Map data &copy; <a class="text-white transition hover:text-sun" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a></p>
			</div>
		</footer>

		<!-- Shared page interactions -->
		<script src="./JS/main.js"></script>
	</body>
</html>