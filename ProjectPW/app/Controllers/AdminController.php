<?php

namespace App\Controllers;

class AdminController extends Controller
{
    public function index(): void
    {
        $this->view->render('admin.php');
    }
}
