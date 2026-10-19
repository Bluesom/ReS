<?php

$requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
if (!is_string($requestPath)) {
    http_response_code(400);
    exit;
}

$requestPath = rawurldecode($requestPath);
if (str_contains($requestPath, "\0")) {
    http_response_code(400);
    exit;
}

$requestPath = '/' . ltrim(str_replace('\\', '/', $requestPath), '/');
$normalizedPath = strtolower($requestPath);
$protectedPaths = [
    '/app',
    '/database',
    '/node_modules',
    '/js/server.js',
    '/app/server.js',
    '/package.json',
    '/package-lock.json',
    '/php-router.php',
    '/readme.md',
];

foreach ($protectedPaths as $protectedPath) {
    if ($normalizedPath === $protectedPath || str_starts_with($normalizedPath, $protectedPath . '/')) {
        http_response_code(404);
        exit;
    }
}

if ($requestPath === '/') {
    $requestPath = '/index.php';
}

$documentRoot = realpath(__DIR__);
$requestedFile = realpath(__DIR__ . str_replace('/', DIRECTORY_SEPARATOR, $requestPath));
if ($documentRoot === false || $requestedFile === false || !is_file($requestedFile)) {
    http_response_code(404);
    exit;
}

$documentRoot = rtrim($documentRoot, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;
if (stripos($requestedFile, $documentRoot) !== 0) {
    http_response_code(404);
    exit;
}

if (strtolower(pathinfo($requestedFile, PATHINFO_EXTENSION)) === 'php') {
    $_SERVER['SCRIPT_NAME'] = $requestPath;
    $_SERVER['SCRIPT_FILENAME'] = $requestedFile;
    require $requestedFile;
    return true;
}

return false;
