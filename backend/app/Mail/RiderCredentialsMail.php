<?php
namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class RiderCredentialsMail extends Mailable
{
    use Queueable, SerializesModels;

    public $userName;
    public $userEmail;
    public $temporaryPassword;

    /**
     * Create a new message instance.
     */
    public function __construct($userName, $userEmail, $temporaryPassword)
    {
        $this->userName = $userName;
        $this->userEmail = $userEmail;
        $this->temporaryPassword = $temporaryPassword;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this
            ->subject('Your Rider Account Credentials - 24 Hour Food')
            ->markdown('emails.rider-credentials');
    }
}