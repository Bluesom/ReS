<?php

namespace App\Controllers;

class HomeController extends Controller
{
    public function index(): void
    {
        $this->view->render('index.php');
    }
}
