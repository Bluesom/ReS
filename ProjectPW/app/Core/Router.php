<?php

namespace App\Core;

use App\Controllers\AdminController;
use App\Controllers\AuthController;
use App\Controllers\BookingController;
use App\Controllers\HomeController;
use App\Controllers\ProfileController;
use RuntimeException;

class Router
{
    private View $view;

    private array $routes = [
        'index.php' => [HomeController::class, 'index'],
        'login.php' => [AuthController::class, 'login'],
        'register.php' => [AuthController::class, 'register'],
        'forgotpassword.php' => [AuthController::class, 'forgotPassword'],
        'bookorder.php' => [BookingController::class, 'index'],
        'profile.php' => [ProfileController::class, 'index'],
        'admin.php' => [AdminController::class, 'index'],
    ];

    public function __construct()
    {
        $viewsPath = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'Views' . DIRECTORY_SEPARATOR . 'pages';
        $this->view = new View($viewsPath);
    }

    public function dispatch(?string $scriptName = null): void
    {
        $scriptName = $scriptName ?? ($_SERVER['SCRIPT_NAME'] ?? '');
        $route = strtolower(basename($scriptName));

        if (!isset($this->routes[$route])) {
            http_response_code(404);
            echo 'Page not found.';
            return;
        }

        [$controllerClass, $action] = $this->routes[$route];
        $controller = new $controllerClass($this->view);

        if (!is_callable([$controller, $action])) {
            throw new RuntimeException('The requested page action is unavailable.');
        }

        $controller->$action();
    }
}
