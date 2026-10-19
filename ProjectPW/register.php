<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Create an Account | Grand Hotel Misurina</title>
		<meta name="description" content="Create your Grand Hotel Misurina guest account.">
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

		<!-- Guest account registration -->
		<main class="flex min-h-svh items-center justify-center bg-mist px-5 pb-8 pt-24 sm:px-8">
			<div class="mx-auto grid max-w-5xl overflow-hidden rounded-sm bg-white shadow-xl md:grid-cols-[0.9fr_1.1fr]">
				<section class="auth-visual auth-visual-register flex flex-col justify-between p-8 text-white sm:p-12">
					<div>
						<p class="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-sun">A warm welcome</p>
						<h1 class="font-display text-4xl font-semibold leading-tight sm:text-5xl">Make room for the mountains.</h1>
						<p class="mt-5 max-w-sm leading-7 text-white/75">Create an account to keep your details together as you plan a quieter kind of escape.</p>
					</div>
					<p class="mt-12 text-sm text-white/80">Grand Hotel Misurina <span class="mx-2 text-sun">·</span> Dolomites, Italy</p>
				</section>

				<section class="flex flex-col justify-center p-7 sm:p-12" id="register">
					<p class="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-clay">Join us</p>
					<h2 class="mb-7 font-display text-3xl font-semibold text-forest">Create an account</h2>
					<form class="auth-form grid gap-5" id="register-form">
						<div>
							<label class="mb-2 block text-sm font-medium text-forest" for="register-name">Name</label>
							<input class="w-full rounded-sm border border-forest/20 bg-paper px-4 py-3 text-ink outline-none transition focus:border-lake focus:ring-2 focus:ring-lake/20" id="register-name" name="name" type="text" autocomplete="name" required>
						</div>
						<div>
							<label class="mb-2 block text-sm font-medium text-forest" for="register-email">Email address</label>
							<input class="w-full rounded-sm border border-forest/20 bg-paper px-4 py-3 text-ink outline-none transition focus:border-lake focus:ring-2 focus:ring-lake/20" id="register-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" required>
						</div>
						<div>
							<label class="mb-2 block text-sm font-medium text-forest" for="register-country">Country</label>
							<input class="w-full rounded-sm border border-forest/20 bg-paper px-4 py-3 text-ink outline-none transition focus:border-lake focus:ring-2 focus:ring-lake/20" id="register-country" name="country" type="search" list="country-options" autocomplete="country-name" placeholder="Search for your country" required>
							<datalist id="country-options"></datalist>
							<input id="register-country-code" name="countryCode" type="hidden">
						</div>
						<div>
							<label class="mb-2 block text-sm font-medium text-forest" for="register-phone">Phone number</label>
							<div class="grid grid-cols-[minmax(9rem,0.8fr)_minmax(0,1.2fr)] gap-2">
								<select class="min-w-0 rounded-sm border border-forest/20 bg-paper px-3 py-3 text-ink outline-none transition focus:border-lake focus:ring-2 focus:ring-lake/20" id="register-phone-country" name="phoneCountryCode" autocomplete="tel-country-code" required>
									<option value="">Country code</option>
								</select>
								<input class="min-w-0 w-full rounded-sm border border-forest/20 bg-paper px-4 py-3 text-ink outline-none transition focus:border-lake focus:ring-2 focus:ring-lake/20" id="register-phone" name="phone" type="tel" inputmode="numeric" autocomplete="tel-national" pattern="[0-9]{4,14}" maxlength="14" placeholder="Phone number" required>
							</div>
							<p class="mt-2 text-xs text-ink/60">Choose your dialing code, then enter digits only.</p>
						</div>
						<div>
							<label class="mb-2 block text-sm font-medium text-forest" for="register-password">Password</label>
							<div class="relative">
								<input class="w-full rounded-sm border border-forest/20 bg-paper px-4 py-3 pr-12 text-ink outline-none transition focus:border-lake focus:ring-2 focus:ring-lake/20" id="register-password" name="password" type="password" autocomplete="new-password" minlength="8" pattern="(?=.*[0-9]).{8,}" title="Use at least 8 characters and include a number." required>
								<button class="absolute inset-y-0 right-0 grid w-12 place-items-center text-ink/60 transition hover:text-forest focus-visible:outline-2 focus-visible:outline-clay" type="button" data-password-toggle="register-password" aria-label="Show password" aria-pressed="false">
									<i class="fa-regular fa-eye" aria-hidden="true"></i>
								</button>
							</div>
							<p class="mt-2 text-xs text-ink/60">Use at least 8 characters and include a number.</p>
						</div>
						<div>
							<label class="mb-2 block text-sm font-medium text-forest" for="register-confirm-password">Confirm password</label>
							<div class="relative">
								<input class="w-full rounded-sm border border-forest/20 bg-paper px-4 py-3 pr-12 text-ink outline-none transition focus:border-lake focus:ring-2 focus:ring-lake/20" id="register-confirm-password" name="confirmPassword" type="password" autocomplete="new-password" minlength="8" required>
								<button class="absolute inset-y-0 right-0 grid w-12 place-items-center text-ink/60 transition hover:text-forest focus-visible:outline-2 focus-visible:outline-clay" type="button" data-password-toggle="register-confirm-password" aria-label="Show confirm password" aria-pressed="false">
									<i class="fa-regular fa-eye" aria-hidden="true"></i>
								</button>
							</div>
						</div>
						<button class="mt-1 inline-flex items-center justify-center gap-3 rounded-full bg-clay px-5 py-3 font-semibold text-white transition hover:bg-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay" type="submit">Create account <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>
						<p class="hidden rounded-sm border border-lake/30 bg-mist p-4 text-sm leading-6 text-forest" role="status" aria-live="polite"></p>
						<p class="pt-2 text-center text-sm text-ink/75">Already have an account? <a class="font-semibold text-forest underline decoration-clay underline-offset-4 transition hover:text-clay" href="./login.php#login">Log in</a>.</p>
					</form>
					<p class="mt-7 text-center text-xs leading-5 text-ink/55">Demo account data is stored locally by the project API. Passwords are hashed by the server.</p>
				</section>
			</div>
		</main>

		<!-- Shared page interactions -->
		<script src="./JS/main.js"></script>
	</body>
</html>