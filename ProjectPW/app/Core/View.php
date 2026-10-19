<?php

namespace App\Core;

use InvalidArgumentException;
use RuntimeException;

class View
{
    private string $viewsPath;

    public function __construct(string $viewsPath)
    {
        $this->viewsPath = rtrim($viewsPath, DIRECTORY_SEPARATOR);
    }

    public function render(string $template, array $data = []): void
    {
        if (!preg_match('/\A[a-zA-Z0-9_-]+\.php\z/', $template)) {
            throw new InvalidArgumentException('Invalid view template name.');
        }

        $file = $this->viewsPath . DIRECTORY_SEPARATOR . $template;
        if (!is_file($file)) {
            throw new RuntimeException('View template not found: ' . $template);
        }

        extract($data, EXTR_SKIP);
        require $file;
    }
}
