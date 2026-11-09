<?php

use App\Http\Controllers\Api\HotelApiController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/metadata/countries', [HotelApiController::class, 'countries']);
Route::get('/metadata/room-types', [HotelApiController::class, 'roomTypeMetadata']);
Route::get('/offers', [HotelApiController::class, 'offers']);

Route::post('/auth/login', [HotelApiController::class, 'login'])->middleware('throttle:10,1');
Route::post('/auth/register', [HotelApiController::class, 'register'])->middleware('throttle:5,1');
Route::post('/auth/reset-password', [HotelApiController::class, 'resetPassword'])->middleware('throttle:5,1');
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::middleware(['auth:sanctum', 'role:guest'])->group(function () {
    Route::get('/auth/guest-session', [HotelApiController::class, 'guestSession']);
    Route::get('/auth/guest-profile', [HotelApiController::class, 'guestProfile']);
    Route::patch('/auth/guest-profile', [HotelApiController::class, 'updateGuestProfile']);
    Route::post('/auth/guest-bookings', [HotelApiController::class, 'guestBookings']);
    Route::post('/auth/logout', [HotelApiController::class, 'logout']);
});

Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/auth/admin-session', [HotelApiController::class, 'adminSession']);
    Route::post('/auth/admin-logout', [HotelApiController::class, 'logout']);

    // JSON Server exposed collection reads to the dashboard; keep those same
    // source-facing IDs and routes while backing them with Eloquent.
    Route::get('/bookings', [HotelApiController::class, 'bookings']);
    Route::patch('/bookings/{id}', [HotelApiController::class, 'updateBooking']);
    Route::get('/rooms', [HotelApiController::class, 'rooms']);
    Route::post('/rooms', [HotelApiController::class, 'createRoom']);
    Route::patch('/rooms/{id}', [HotelApiController::class, 'updateRoom']);
    Route::delete('/rooms/{id}', [HotelApiController::class, 'deleteRoom']);
    Route::get('/roomTypes', [HotelApiController::class, 'roomTypes']);
    Route::post('/roomTypes', [HotelApiController::class, 'createRoomType']);
    Route::patch('/roomTypes/{id}', [HotelApiController::class, 'updateRoomType']);
    Route::delete('/roomTypes/{id}', [HotelApiController::class, 'deleteRoomType']);
    Route::get('/guests', [HotelApiController::class, 'guests']);
    Route::post('/guests', [HotelApiController::class, 'createGuest']);
    Route::patch('/guests/{id}', [HotelApiController::class, 'updateGuest']);
    Route::delete('/guests/{id}', [HotelApiController::class, 'deleteGuest']);
    Route::post('/offers', [HotelApiController::class, 'createOffer']);
    Route::patch('/offers/{id}', [HotelApiController::class, 'updateOffer']);
    Route::delete('/offers/{id}', [HotelApiController::class, 'deleteOffer']);
    Route::post('/uploads/image', [HotelApiController::class, 'uploadImage']);

});
