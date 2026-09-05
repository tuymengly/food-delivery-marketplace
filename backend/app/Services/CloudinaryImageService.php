<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class CloudinaryImageService
{
    public function upload(UploadedFile $file, string $folder): string
    {
        $path = Storage::disk('cloudinary')->putFile($folder, $file);

        return Storage::disk('cloudinary')->url($path);
    }
}
