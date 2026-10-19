<?php

namespace App\Controllers;

class AuthController extends Controller
{
    public function login(): void
    {
        $this->view->render('login.php');
    }

    public function register(): void
    {
        $this->view->render('register.php');
    }

    public function forgotPassword(): void
    {
        $this->view->render('ForgotPassword.php');
    }
}
