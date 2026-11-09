<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\GuestProfile;
use App\Models\Offer;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use App\Services\AccountService;
use App\Services\HotelDomainService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Illuminate\Http\Exceptions\HttpResponseException;

class HotelApiController extends Controller
{
    private const COUNTRY_CODES = 'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW';
    private const DIAL_CODES = [
        'AU' => '61', 'BR' => '55', 'CA' => '1', 'CN' => '86', 'DE' => '49',
        'ES' => '34', 'FR' => '33', 'GB' => '44', 'ID' => '62', 'IN' => '91',
        'IT' => '39', 'JP' => '81', 'KR' => '82', 'MY' => '60', 'NL' => '31',
        'NZ' => '64', 'PH' => '63', 'SG' => '65', 'TH' => '66', 'US' => '1',
        'VN' => '84',
    ];

    private static function dialCodes(): array
    {
        $pairs = explode(' ', 'AC:247 AD:376 AE:971 AF:93 AG:1 AI:1 AL:355 AM:374 AO:244 AR:54 AS:1 AT:43 AU:61 AW:297 AX:358 AZ:994 BA:387 BB:1 BD:880 BE:32 BF:226 BG:359 BH:973 BI:257 BJ:229 BL:590 BM:1 BN:673 BO:591 BQ:599 BR:55 BS:1 BT:975 BW:267 BY:375 BZ:501 CA:1 CC:61 CD:243 CF:236 CG:242 CH:41 CI:225 CK:682 CL:56 CM:237 CN:86 CO:57 CR:506 CU:53 CV:238 CW:599 CX:61 CY:357 CZ:420 DE:49 DJ:253 DK:45 DM:1 DO:1 DZ:213 EC:593 EE:372 EG:20 EH:212 ER:291 ES:34 ET:251 FI:358 FJ:679 FK:500 FM:691 FO:298 FR:33 GA:241 GB:44 GD:1 GE:995 GF:594 GG:44 GH:233 GI:350 GL:299 GM:220 GN:224 GP:590 GQ:240 GR:30 GT:502 GU:1 GW:245 GY:592 HK:852 HN:504 HR:385 HT:509 HU:36 ID:62 IE:353 IL:972 IM:44 IN:91 IO:246 IQ:964 IR:98 IS:354 IT:39 JE:44 JM:1 JO:962 JP:81 KE:254 KG:996 KH:855 KI:686 KM:269 KN:1 KP:850 KR:82 KW:965 KY:1 KZ:7 LA:856 LB:961 LC:1 LI:423 LK:94 LR:231 LS:266 LT:370 LU:352 LV:371 LY:218 MA:212 MC:377 MD:373 ME:382 MF:590 MG:261 MH:692 MK:389 ML:223 MM:95 MN:976 MO:853 MP:1 MQ:596 MR:222 MS:1 MT:356 MU:230 MV:960 MW:265 MX:52 MY:60 MZ:258 NA:264 NC:687 NE:227 NF:672 NG:234 NI:505 NL:31 NO:47 NP:977 NR:674 NU:683 NZ:64 OM:968 PA:507 PE:51 PF:689 PG:675 PH:63 PK:92 PL:48 PM:508 PR:1 PS:970 PT:351 PW:680 PY:595 QA:974 RE:262 RO:40 RS:381 RU:7 RW:250 SA:966 SB:677 SC:248 SD:249 SE:46 SG:65 SH:290 SI:386 SJ:47 SK:421 SL:232 SM:378 SN:221 SO:252 SR:597 SS:211 ST:239 SV:503 SX:1 SY:963 SZ:268 TA:290 TC:1 TD:235 TG:228 TH:66 TJ:992 TK:690 TL:670 TM:993 TN:216 TO:676 TR:90 TT:1 TV:688 TW:886 TZ:255 UA:380 UG:256 US:1 UY:598 UZ:998 VA:39 VC:1 VE:58 VG:1 VI:1 VN:84 VU:678 WF:681 WS:685 XK:383 YE:967 YT:262 ZA:27 ZM:260 ZW:263');
        $codes = [];
        foreach ($pairs as $pair) {
            [$country, $callingCode] = explode(':', $pair, 2);
            $codes[$country] = $callingCode;
        }
        return $codes;
    }

    public function countries()
    {
        $countries = [];
        foreach (array_keys(self::dialCodes()) as $code) {
            $name = \Locale::getDisplayRegion('en_'.$code, 'en');
            if ($name && $name !== $code) {
                $countries[] = [
                    'code' => $code,
                    'name' => $name,
                    'dialCode' => ''.self::dialCodes()[$code],
                ];
            }
        }

        usort($countries, fn ($a, $b) => strcasecmp($a['name'], $b['name']));
        return response()->json($countries);
    }

    public function roomTypeMetadata()
    {
        return response()->json(RoomType::query()->orderBy('id')->get()->map(
            fn (RoomType $roomType) => $this->roomTypeData($roomType)
        ));
    }

    public function offers(Request $request)
    {
        if ($request->query('admin') === 'true') {
            $admin = Auth::guard('sanctum')->user();
            if (!$admin || $admin->role !== 'admin') {
                return response()->json(['error' => 'An administrator must log in to access this data.'], 401);
            }

            return response()->json(Offer::query()->orderBy('id')->get()->map(
                fn (Offer $offer) => $this->offerData($offer)
            ));
        }

        $today = now('UTC')->toDateString();
        return response()->json(Offer::query()->where('active', true)
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->orderBy('id')->get()->map(fn (Offer $offer) => $this->offerData($offer)));
    }

    public function login(Request $request)
    {
        $data = $this->validated($request->all(), [
            'email' => ['required', 'string', 'email', 'max:254'],
            'password' => ['required', 'string', 'max:128'],
        ]);
        $user = app(AccountService::class)->authenticate($data['email'], $data['password']);
        if (!$user) {
            return response()->json(['error' => 'Email or password is incorrect.'], 401);
        }

        $token = $user->createToken('api', ['*'], now()->addHours(2))->plainTextToken;
        $account = $user->role === 'admin'
            ? [
                'id' => $user->source_id,
                'adminNumber' => $user->adminProfile?->admin_number,
                'name' => $user->name,
                'email' => $user->email,
            ]
            : [
                'id' => $user->source_id,
                'guestNumber' => $user->guestProfile?->guest_number,
                'name' => $user->name,
                'email' => $user->email,
            ];

        return response()->json(['token' => $token, 'role' => $user->role, 'account' => $account]);
    }

    public function adminSession(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'id' => $user->source_id,
            'adminNumber' => $user->adminProfile?->admin_number,
            'name' => $user->name,
            'email' => $user->email,
        ]);
    }

    public function guestSession(Request $request)
    {
        return response()->json($this->guestData($request->user()->guestProfile));
    }

    public function guestProfile(Request $request)
    {
        return response()->json($this->guestProfileData($request->user()->guestProfile));
    }

    public function updateGuestProfile(Request $request)
    {
        $data = $this->validated($request->all(), [
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email', 'max:254'],
            'countryCode' => ['required', 'string', 'size:2'],
            'phone' => ['required', 'string', 'max:32'],
        ], [
            'name.required' => 'Name is required and must be 100 characters or fewer.',
            'email.email' => 'Enter a valid email address.',
        ]);
        $user = $request->user();
        $email = mb_strtolower(trim($data['email']));
        if (User::query()->where('email', $email)->where('id', '<>', $user->id)->exists()) {
            return response()->json(['error' => 'An account with this email already exists.'], 409);
        }

        $countryCode = strtoupper($data['countryCode']);
        $country = \Locale::getDisplayRegion('en_'.$countryCode, 'en');
        $phone = $this->normalizePhone($data['phone']);
        if (!array_key_exists($countryCode, self::dialCodes()) || !$country || !$this->validPhone($phone)) {
            return response()->json(['error' => !$country ? 'Choose a valid country.' : 'Enter a valid international phone number.'], 400);
        }

        DB::transaction(function () use ($user, $data, $email, $country, $phone) {
            $user->update(['name' => trim($data['name']), 'email' => $email]);
            $user->guestProfile->update(['country' => $country, 'phone' => $phone]);
        });

        return response()->json($this->guestProfileData($user->fresh()->guestProfile));
    }

    public function logout(Request $request)
    {
        app(AccountService::class)->logout($request);
        return response()->noContent();
    }

    public function resetPassword(Request $request)
    {
        $data = $this->validated($request->all(), [
            'email' => ['required', 'string', 'email', 'max:254'],
            'password' => ['required', 'string', 'min:8', 'max:128', 'regex:/\d/'],
            'confirmPassword' => ['required', 'same:password'],
        ], [
            'password.regex' => 'Password must be at least 8 characters, include a number, and be no more than 128 bytes.',
            'confirmPassword.same' => 'Passwords do not match.',
        ]);
        $user = User::query()->where('email', mb_strtolower(trim($data['email'])))->first();
        if (!$user || ($user->role === 'guest' && !$user->guestProfile?->active)) {
            return response()->json(['error' => 'No account was found with that email address.'], 404);
        }
        if (strlen($data['password']) > 128) {
            return response()->json(['error' => 'Password must be at least 8 characters, include a number, and be no more than 128 bytes.'], 400);
        }

        app(AccountService::class)->resetPassword($user, $data['password']);

        return response()->json(['message' => 'Password updated. You can now sign in.']);
    }

    public function register(Request $request)
    {
        $data = $this->validated($request->all(), [
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email', 'max:254'],
            'countryCode' => ['required', 'string', 'size:2'],
            'phoneCountryCode' => ['required', 'string', 'size:2'],
            'phone' => ['required', 'string', 'regex:/^\d{4,14}$/'],
            'password' => ['required', 'string', 'min:8', 'max:128', 'regex:/\d/'],
            'confirmPassword' => ['required', 'same:password'],
        ]);
        if (strlen($data['password']) > 128) {
            return response()->json(['error' => 'Password must be at least 8 characters, include a number, and be no more than 128 bytes.'], 400);
        }
        $email = mb_strtolower(trim($data['email']));
        if (User::query()->where('email', $email)->exists()) {
            return response()->json(['error' => 'An account with this email already exists.'], 409);
        }

        $countryCode = strtoupper($data['countryCode']);
        $country = \Locale::getDisplayRegion('en_'.$countryCode, 'en');
        $phoneCountryCode = strtoupper($data['phoneCountryCode']);
        if (!array_key_exists($phoneCountryCode, self::dialCodes())) {
            return response()->json(['error' => 'Choose a valid phone country code.'], 400);
        }
        $phone = '+'.self::dialCodes()[$phoneCountryCode].ltrim($data['phone'], '0');
        if (!array_key_exists($countryCode, self::dialCodes()) || !$country) {
            return response()->json(['error' => 'Choose a valid country.'], 400);
        }
        if (!$this->validPhone($phone)) {
            return response()->json(['error' => 'Enter a valid phone number for the selected country code.'], 400);
        }

        [$user] = app(AccountService::class)->registerGuest($data, $email, $country, $phone);

        return response()->json([
            'id' => $user->source_id,
            'name' => $user->name,
            'email' => $user->email,
        ], 201);
    }

    public function guestBookings(Request $request)
    {
        $data = $this->validated($request->all(), [
            'checkIn' => ['required', 'date_format:Y-m-d'],
            'checkOut' => ['required', 'date_format:Y-m-d'],
            'guests' => ['required', 'integer', 'min:1', 'max:20'],
            'roomTypeId' => ['required', 'string', 'max:64'],
            'requests' => ['nullable', 'string', 'max:2000'],
        ]);
        [$booking, $roomType] = app(HotelDomainService::class)->createGuestBooking($request->user(), $data);

        return response()->json([
            'booking' => [
                'id' => $booking->source_id,
                'checkIn' => $booking->check_in->format('Y-m-d'),
                'checkOut' => $booking->check_out->format('Y-m-d'),
                'guests' => $booking->guests,
                'status' => $booking->status,
                'totalAmount' => (float) $booking->total_amount,
                'roomType' => $roomType->name,
            ],
            'message' => 'Your availability request has been saved as a pending booking.',
        ], 201);
    }

    public function bookings()
    {
        return response()->json(Booking::query()->with(['guestProfile.user', 'roomType'])
            ->orderByDesc('check_in')->get()->map(fn (Booking $booking) => $this->bookingData($booking)));
    }

    public function rooms()
    {
        return response()->json(Room::query()->with('roomType')->orderBy('id')->get()
            ->map(fn (Room $room) => $this->roomData($room)));
    }

    public function roomTypes()
    {
        return response()->json(RoomType::query()->orderBy('id')->get()
            ->map(fn (RoomType $roomType) => $this->roomTypeData($roomType)));
    }

    public function guests()
    {
        return response()->json(GuestProfile::query()->with('user')->orderBy('id')->get()
            ->map(fn (GuestProfile $guest) => $this->guestData($guest)));
    }

    public function updateBooking(Request $request, string $id)
    {
        $data = $this->validated($request->all(), [
            'status' => ['sometimes', 'string', 'in:pending,confirmed,checked-in,checked-out,cancelled'],
            'roomId' => ['sometimes', 'nullable', 'string', 'max:64'],
            'offerId' => ['sometimes', 'nullable', 'string', 'max:64'],
        ]);
        $booking = Booking::query()->with('roomType')->where('source_id', $id)->first();
        if (!$booking) {
            return response()->json(['error' => 'Booking not found.'], 404);
        }

        $result = app(HotelDomainService::class)->updateBooking($booking, $data);

        return response()->json($this->bookingData($result));
    }

    public function createRoomType(Request $request)
    {
        $data = $this->roomTypeInput($request);
        $roomType = RoomType::query()->create(['source_id' => 'RT-'.Str::uuid()] + $data);
        return response()->json($this->roomTypeData($roomType), 201);
    }

    public function updateRoomType(Request $request, string $id)
    {
        $roomType = RoomType::query()->where('source_id', $id)->first();
        if (!$roomType) {
            return response()->json(['error' => 'Room type not found.'], 404);
        }
        $roomType->update($this->roomTypeInput($request));
        return response()->json($this->roomTypeData($roomType->fresh()));
    }

    public function deleteRoomType(string $id)
    {
        $roomType = RoomType::query()->where('source_id', $id)->first();
        if (!$roomType) {
            return response()->json(['error' => 'Room type not found.'], 404);
        }
        if ($roomType->rooms()->exists() || $roomType->bookings()->exists()) {
            return response()->json(['error' => 'This room type is used by a room or booking. Remove its physical rooms and retain the type for booking history.'], 409);
        }
        $roomType->delete();
        return response()->noContent();
    }

    public function createRoom(Request $request)
    {
        $room = Room::query()->create(['source_id' => 'R-'.Str::uuid()] + $this->roomInput($request));
        return response()->json($this->roomData($room->load('roomType')), 201);
    }

    public function updateRoom(Request $request, string $id)
    {
        $room = Room::query()->where('source_id', $id)->first();
        if (!$room) {
            return response()->json(['error' => 'Room not found.'], 404);
        }
        $data = $this->roomInput($request);
        if ($room->bookings()->where('room_type_id', '<>', $data['room_type_id'])->exists()) {
            return response()->json(['error' => 'A room with booking history cannot change room type.'], 409);
        }
        if ($data['status'] === 'maintenance' && $room->bookings()
            ->whereIn('status', ['confirmed', 'checked-in'])
            ->whereDate('check_out', '>=', now('UTC')->toDateString())->exists()) {
            return response()->json(['error' => 'This room has an upcoming or active stay. Reassign or cancel it before marking the room under maintenance.'], 409);
        }
        $room->update($data);
        return response()->json($this->roomData($room->fresh()->load('roomType')));
    }

    public function deleteRoom(string $id)
    {
        $room = Room::query()->where('source_id', $id)->first();
        if (!$room) {
            return response()->json(['error' => 'Room not found.'], 404);
        }
        if ($room->bookings()->exists()) {
            return response()->json(['error' => 'This room is referenced by booking history and cannot be deleted.'], 409);
        }
        $room->delete();
        return response()->noContent();
    }

    public function createGuest(Request $request)
    {
        $data = $this->validated($request->all(), [
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email', 'max:254'],
            'country' => ['required', 'string', 'max:80'],
            'phone' => ['required', 'string', 'max:32'],
            'password' => ['required', 'string', 'min:8', 'max:128', 'regex:/\d/'],
        ]);
        $email = mb_strtolower(trim($data['email']));
        if (User::query()->where('email', $email)->exists()) {
            return response()->json(['error' => 'An account with this email already exists.'], 409);
        }
        $phone = $this->normalizePhone($data['phone']);
        if (!$this->validPhone($phone)) {
            return response()->json(['error' => 'Enter a valid international phone number, including its country code.'], 400);
        }

        [$user, $profile] = DB::transaction(function () use ($data, $email, $phone) {
            $sequence = DB::table('sequences')->where('sequence_name', 'guestNumber')->lockForUpdate()->first();
            $next = max((int) ($sequence->current_value ?? 0), $this->highestGuestNumber()) + 1;
            DB::table('sequences')->where('sequence_name', 'guestNumber')->update(['current_value' => $next]);
            $user = User::query()->create([
                'source_id' => 'G-'.Str::uuid(),
                'role' => 'guest',
                'name' => trim($data['name']),
                'email' => $email,
                'password' => Hash::make($data['password']),
                'password_scheme' => 'laravel',
            ]);
            $profile = $user->guestProfile()->create([
                'guest_number' => 'G-'.str_pad((string) $next, 3, '0', STR_PAD_LEFT),
                'country' => trim($data['country']),
                'phone' => $phone,
            ]);
            return [$user, $profile];
        });

        return response()->json($this->guestData($profile->load('user')), 201);
    }

    public function updateGuest(Request $request, string $id)
    {
        $guest = GuestProfile::query()->whereHas('user', fn ($query) => $query->where('source_id', $id))->with('user')->first();
        if (!$guest) {
            return response()->json(['error' => 'Guest not found.'], 404);
        }

        $profileUpdates = [];
        $userUpdates = [];
        if ($request->exists('name')) {
            $name = is_string($request->input('name')) ? trim($request->input('name')) : '';
            if ($name === '' || mb_strlen($name) > 100) {
                return response()->json(['error' => 'Guest name is required and must be 100 characters or fewer.'], 400);
            }
            $userUpdates['name'] = $name;
        }
        if ($request->exists('email')) {
            $email = is_string($request->input('email')) ? mb_strtolower(trim($request->input('email'))) : '';
            if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254) {
                return response()->json(['error' => 'Enter a valid email address.'], 400);
            }
            if (User::query()->where('email', $email)->where('id', '<>', $guest->user_id)->exists()) {
                return response()->json(['error' => 'An account with this email already exists.'], 409);
            }
            $userUpdates['email'] = $email;
        }
        if ($request->exists('phone')) {
            $phone = is_string($request->input('phone')) ? $this->normalizePhone($request->input('phone')) : '';
            if (!$this->validPhone($phone)) {
                return response()->json(['error' => 'Enter a valid international phone number, including its country code.'], 400);
            }
            $profileUpdates['phone'] = $phone;
        }
        if ($request->exists('country')) {
            $country = is_string($request->input('country')) ? trim($request->input('country')) : '';
            if ($country === '' || mb_strlen($country) > 80) {
                return response()->json(['error' => 'Country is required and must be 80 characters or fewer.'], 400);
            }
            $profileUpdates['country'] = $country;
        }
        if ($request->exists('active')) {
            if (!is_bool($request->input('active'))) {
                return response()->json(['error' => 'Account active state must be true or false.'], 400);
            }
            $profileUpdates['active'] = $request->input('active');
        }

        DB::transaction(function () use ($guest, $profileUpdates, $userUpdates) {
            if ($profileUpdates) {
                $guest->update($profileUpdates);
            }
            if ($userUpdates) {
                $guest->user->update($userUpdates);
            }
        });
        if (($profileUpdates['active'] ?? null) === false) {
            $guest->user->tokens()->delete();
            Auth::forgetGuards();
        }
        return response()->json($this->guestData($guest->fresh()->load('user')));
    }

    public function deleteGuest(string $id)
    {
        $guest = GuestProfile::query()->whereHas('user', fn ($query) => $query->where('source_id', $id))->with('user')->first();
        if (!$guest) {
            return response()->json(['error' => 'Guest not found.'], 404);
        }
        $guest->update(['active' => false]);
        $guest->user->tokens()->delete();
        Auth::forgetGuards();
        return response()->json($this->guestData($guest->fresh()->load('user')));
    }

    public function createOffer(Request $request)
    {
        $offer = Offer::query()->create(['source_id' => 'O-'.Str::uuid()] + $this->offerInput($request));
        return response()->json($this->offerData($offer), 201);
    }

    public function updateOffer(Request $request, string $id)
    {
        $offer = Offer::query()->where('source_id', $id)->first();
        if (!$offer) {
            return response()->json(['error' => 'Offer not found.'], 404);
        }
        $offer->update($this->offerInput($request));
        return response()->json($this->offerData($offer->fresh()));
    }

    public function deleteOffer(string $id)
    {
        $offer = Offer::query()->where('source_id', $id)->first();
        if (!$offer) {
            return response()->json(['error' => 'Offer not found.'], 404);
        }
        $offer->delete();
        return response()->noContent();
    }

    public function uploadImage(Request $request)
    {
        $content = $request->getContent();
        $mime = strtolower(trim(explode(';', (string) $request->header('Content-Type'))[0]));
        $formats = [
            'image/jpeg' => ['jpg', fn ($bytes) => strlen($bytes) >= 3 && substr($bytes, 0, 3) === "\xff\xd8\xff"],
            'image/png' => ['png', fn ($bytes) => substr($bytes, 0, 8) === "\x89PNG\r\n\x1a\n"],
            'image/webp' => ['webp', fn ($bytes) => strlen($bytes) >= 12 && substr($bytes, 0, 4) === 'RIFF' && substr($bytes, 8, 4) === 'WEBP'],
        ];
        if (!isset($formats[$mime])) {
            return response()->json(['error' => 'Choose a JPEG, PNG, or WebP image.'], 400);
        }
        if (strlen($content) > 5 * 1024 * 1024) {
            return response()->json(['error' => 'Room photos must be 5 MB or smaller.'], 413);
        }
        if (!$formats[$mime][1]($content)) {
            return response()->json(['error' => 'The selected file does not match its image format.'], 400);
        }
        $name = 'room-'.Str::uuid().'.'.$formats[$mime][0];
        $directory = public_path('assets');
        if (!is_dir($directory) && !mkdir($directory, 0755, true) && !is_dir($directory)) {
            throw new HttpException(500, 'Could not create the public image directory.');
        }
        file_put_contents($directory.DIRECTORY_SEPARATOR.$name, $content, LOCK_EX);
        return response()->json(['imagePath' => './Assets/'.$name], 201);
    }

    private function roomTypeInput(Request $request): array
    {
        $data = $this->validated($request->all(), [
            'name' => ['required', 'string', 'max:80'],
            'description' => ['nullable', 'string', 'max:1000'],
            'ratePerNight' => ['required', 'numeric', 'min:0'],
            'capacity' => ['required', 'integer', 'min:1', 'max:20'],
            'imagePath' => ['nullable', 'string', 'max:255'],
            'bedType' => ['required', 'in:King,Queen,Double,Twin,Single'],
            'smokingAllowed' => ['required', 'boolean'],
            'sofa' => ['required', 'boolean'],
            'amenities' => ['nullable', 'array'],
            'amenities.*' => ['string', 'in:Wi-Fi,Balcony,Lake view,Mini bar,Air conditioning'],
            'mealPlan' => ['required', 'in:No meals,Breakfast,Breakfast and dinner'],
        ]);
        $this->validateImagePath($data['imagePath'] ?? '', 'Room image');
        $data['name'] = trim($data['name']);
        $data['description'] = trim($data['description'] ?? '');
        $data['image_path'] = trim($data['imagePath'] ?? '');
        $data['rate_per_night'] = (float) $data['ratePerNight'];
        $data['bed_type'] = $data['bedType'];
        $data['smoking_allowed'] = (bool) $data['smokingAllowed'];
        $data['amenities'] = array_values(array_unique($data['amenities'] ?? []));
        $data['meal_plan'] = $data['mealPlan'];
        unset($data['imagePath'], $data['ratePerNight'], $data['bedType'], $data['smokingAllowed'], $data['mealPlan']);
        return $data;
    }

    private function roomInput(Request $request): array
    {
        $data = $this->validated($request->all(), [
            'roomNumber' => ['required', 'string', 'max:32'],
            'roomTypeId' => ['required', 'string', 'max:64'],
            'floor' => ['required', 'integer', 'min:0', 'max:100'],
            'status' => ['required', 'in:available,maintenance'],
        ]);
        $roomType = RoomType::query()->where('source_id', $data['roomTypeId'])->first();
        if (!$roomType) {
            throw new HttpException(400, 'Choose an existing room type.');
        }
        $number = trim($data['roomNumber']);
        $duplicate = Room::query()->whereRaw('LOWER(room_number) = ?', [mb_strtolower($number)]);
        if ($request->route('id')) {
            $duplicate->where('source_id', '<>', $request->route('id'));
        }
        if ($duplicate->exists()) {
            throw new HttpException(400, 'Room number already exists.');
        }
        return [
            'room_number' => $number,
            'room_type_id' => $roomType->id,
            'floor' => $data['floor'],
            'status' => $data['status'],
        ];
    }

    private function offerInput(Request $request): array
    {
        $data = $this->validated($request->all(), [
            'title' => ['required', 'string', 'max:100'],
            'description' => ['required', 'string', 'max:500'],
            'discountType' => ['required', 'in:percentage,fixed'],
            'discountValue' => ['required', 'numeric', 'gt:0'],
            'startDate' => ['required', 'date_format:Y-m-d'],
            'endDate' => ['required', 'date_format:Y-m-d', 'after_or_equal:startDate'],
            'active' => ['required', 'boolean'],
            'imagePath' => ['nullable', 'string', 'max:255'],
        ]);
        if ($data['discountType'] === 'percentage' && $data['discountValue'] > 100) {
            throw new HttpException(400, 'Percentage discount must be between 1 and 100.');
        }
        $this->validateImagePath($data['imagePath'] ?? '', 'Offer image');
        return [
            'title' => trim($data['title']),
            'description' => trim($data['description']),
            'discount_type' => $data['discountType'],
            'discount_value' => (float) $data['discountValue'],
            'start_date' => $data['startDate'],
            'end_date' => $data['endDate'],
            'active' => (bool) $data['active'],
            'image_path' => trim($data['imagePath'] ?? ''),
        ];
    }

    private function validateImagePath(string $imagePath, string $label): void
    {
        if ($imagePath !== '' && (!str_starts_with($imagePath, './Assets/') ||
            str_contains($imagePath, '..') || preg_match('/["\'<>\s\x00-\x1f\\\\]/', $imagePath))) {
            throw new HttpException(400, "{$label} must be a local path inside the Assets folder, such as ./Assets/photo.jpg.");
        }
    }

    private function validated(array $input, array $rules, array $messages = []): array
    {
        $validator = Validator::make($input, $rules, $messages);
        if ($validator->fails()) {
            throw new HttpResponseException(response()->json([
                'error' => $validator->errors()->first(),
            ], 400));
        }
        return $validator->validated();
    }

    private function highestGuestNumber(): int
    {
        return GuestProfile::query()->pluck('guest_number')->reduce(function (int $highest, string $number) {
            return preg_match('/^G-(\d+)$/', $number, $match)
                ? max($highest, (int) $match[1])
                : $highest;
        }, 0);
    }

    private function normalizePhone(string $phone): string
    {
        $phone = trim($phone);
        $digits = preg_replace('/\D+/', '', $phone);
        return str_starts_with($phone, '+') ? '+'.$digits : '+'.$digits;
    }

    private function validPhone(string $phone): bool
    {
        return preg_match('/^\+[1-9]\d{6,14}$/', $phone) === 1;
    }

    private function guestData(GuestProfile $guest): array
    {
        $user = $guest->user;
        return [
            'id' => $user->source_id,
            'guestNumber' => $guest->guest_number,
            'name' => $user->name,
            'email' => $user->email,
            'country' => $guest->country,
            'phone' => $guest->phone,
            'active' => $guest->active,
            'totalBookings' => $guest->total_bookings,
            'lastStay' => $guest->last_stay?->format('Y-m-d'),
            'createdAt' => $user->created_at?->toISOString(),
        ];
    }

    private function guestProfileData(GuestProfile $guest): array
    {
        $guest->loadMissing(['user', 'bookings.roomType']);
        $bookings = $guest->bookings->sortByDesc(fn (Booking $booking) => $booking->check_in->format('Y-m-d'))
            ->map(fn (Booking $booking) => [
                'id' => $booking->source_id,
                'roomType' => $booking->roomType?->name ?? '',
                'checkIn' => $booking->check_in->format('Y-m-d'),
                'checkOut' => $booking->check_out->format('Y-m-d'),
                'guests' => $booking->guests,
                'status' => $booking->status,
            ])->values();
        return [
            'guest' => [
                'id' => $guest->user->source_id,
                'guestNumber' => $guest->guest_number,
                'name' => $guest->user->name,
                'email' => $guest->user->email,
                'phone' => $guest->phone,
                'country' => $guest->country,
                'createdAt' => $guest->user->created_at?->toISOString(),
            ],
            'bookings' => $bookings,
        ];
    }

    private function roomTypeData(RoomType $roomType): array
    {
        return [
            'id' => $roomType->source_id,
            'name' => $roomType->name,
            'ratePerNight' => (float) $roomType->rate_per_night,
            'description' => $roomType->description ?? '',
            'imagePath' => $roomType->image_path ?? '',
            'capacity' => (int) $roomType->capacity,
            'bedType' => $roomType->bed_type,
            'smokingAllowed' => (bool) $roomType->smoking_allowed,
            'sofa' => (bool) $roomType->sofa,
            'amenities' => $roomType->amenities ?? [],
            'mealPlan' => $roomType->meal_plan,
        ];
    }

    private function roomData(Room $room): array
    {
        return [
            'id' => $room->source_id,
            'roomNumber' => $room->room_number,
            'roomTypeId' => $room->roomType?->source_id,
            'floor' => (int) $room->floor,
            'status' => $room->status,
        ];
    }

    private function offerData(Offer $offer): array
    {
        return [
            'id' => $offer->source_id,
            'title' => $offer->title,
            'description' => $offer->description,
            'discountType' => $offer->discount_type,
            'discountValue' => (float) $offer->discount_value,
            'startDate' => $offer->start_date->format('Y-m-d'),
            'endDate' => $offer->end_date->format('Y-m-d'),
            'active' => (bool) $offer->active,
            'imagePath' => $offer->image_path ?? '',
        ];
    }

    private function bookingData(Booking $booking): array
    {
        $booking->loadMissing(['guestProfile.user', 'roomType', 'room']);
        return [
            'id' => $booking->source_id,
            'guestId' => $booking->guestProfile?->user?->source_id,
            'guestName' => $booking->guestProfile?->user?->name,
            'roomTypeId' => $booking->roomType?->source_id,
            'roomId' => $booking->room?->source_id,
            'checkIn' => $booking->check_in->format('Y-m-d'),
            'checkOut' => $booking->check_out->format('Y-m-d'),
            'guests' => (int) $booking->guests,
            'status' => $booking->status,
            'totalAmount' => (float) $booking->total_amount,
            'baseAmount' => (float) $booking->base_amount,
            'appliedOffer' => $booking->applied_offer,
            'offerDiscountAmount' => (float) $booking->offer_discount_amount,
            'requests' => $booking->requests ?? '',
            'createdAt' => $booking->created_at?->toISOString(),
        ];
    }
}
