<?php

namespace App\Controllers;

class ProfileController extends Controller
{
    public function index(): void
    {
        $this->view->render('profile.php');
    }
}
