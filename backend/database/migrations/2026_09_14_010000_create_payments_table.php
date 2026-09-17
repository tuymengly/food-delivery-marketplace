<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('payment_method', 20)->default('khqr');
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3);
            $table->string('status', 20)->default('pending');
            $table->text('qr_string')->nullable();
            // MD5 of the generated KHQR string - the lookup key Bakong's
            // check_transaction_by_md5 API uses. Unique so the same QR
            // payload can never be recorded as two separate payments.
            $table->string('md5', 32)->nullable()->unique();
            // Populated once Bakong confirms the transaction. Unique so the
            // same real-world Bakong transaction can never be applied to
            // more than one payment/order.
            $table->string('bakong_transaction_hash')->nullable()->unique();
            $table->string('bakong_from_account_id')->nullable();
            $table->string('bakong_to_account_id')->nullable();
            $table->json('bakong_response')->nullable();
            $table->string('failed_reason')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index(['order_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
