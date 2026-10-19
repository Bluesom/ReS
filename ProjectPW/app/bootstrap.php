<?php

if (!defined('APP_BOOTSTRAPPED')) {
    define('APP_BOOTSTRAPPED', true);
}

spl_autoload_register(static function (string $class): void {
    $prefix = 'App\\';
    if (strncmp($class, $prefix, strlen($prefix)) !== 0) {
        return;
    }

    $classPath = substr($class, strlen($prefix));
    $file = __DIR__ . DIRECTORY_SEPARATOR
        . str_replace('\\', DIRECTORY_SEPARATOR, $classPath)
        . '.php';

    if (is_file($file)) {
        require_once $file;
    }
});

(new App\Core\Router())->dispatch();
