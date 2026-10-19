<?php

namespace App\Controllers;

use App\Core\View;

abstract class Controller
{
    protected View $view;

    public function __construct(View $view)
    {
        $this->view = $view;
    }
}
