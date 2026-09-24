<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Mail\RiderCredentialsMail;

class EmailController extends Controller
{
    /**
     * Send rider credentials email to the specified email address.
     * Admin-only endpoint for sending login credentials to newly created riders.
     */
    public function sendRiderCredentials(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'name' => 'required|string',
            'password' => 'required|string',
        ]);

        try {
            Mail::to($validated['email'])->send(
                new RiderCredentialsMail(
                    $validated['name'],
                    $validated['email'],
                    $validated['password']
                )
            );

            return response()->json([
                'success' => true,
                'message' => 'Credentials email sent successfully.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send email: ' . $e->getMessage(),
            ], 500);
        }
    }
}