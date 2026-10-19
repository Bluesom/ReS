<?php

namespace App\Controllers;

class BookingController extends Controller
{
    public function index(): void
    {
        $this->view->render('BookOrder.php');
    }
}
