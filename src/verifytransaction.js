"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyTransaction = verifyTransaction;
var ethers_1 = require("ethers");
var supabase_1 = require("@/lib/supabase");
function verifyTransaction(paymentId_1) {
    return __awaiter(this, arguments, void 0, function (paymentId, requiredConfirmations) {
        var flags, _a, payment, paymentError, retryCount, timeSinceCreated, hoursElapsed, provider, tx, receipt, providerError_1, currentBlock, confirmations, block, txTimestamp, expectedAmount, tolerance, toleranceAmount, amountDiff, _b, session, sessionError, createdAt, expiresAt, bufferTime, bufferedCreatedAt, bufferedExpiresAt, finalStatus, criticalFlags, updateData, updateError, err_1, currentPayment, retryUpdateError_1;
        var _c;
        var _d, _e;
        if (requiredConfirmations === void 0) { requiredConfirmations = 3; }
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    flags = [];
                    _f.label = 1;
                case 1:
                    _f.trys.push([1, 24, , 31]);
                    return [4 /*yield*/, supabase_1.supabase
                            .from('payments')
                            .select("\n        id, tx_hash, network, status, retry_count, last_verified_at, created_at,\n        amount, to_wallet_address, tolerance_percentage\n      ")
                            .eq('id', paymentId)
                            .single()];
                case 2:
                    _a = _f.sent(), payment = _a.data, paymentError = _a.error;
                    if (paymentError || !payment) {
                        return [2 /*return*/, { success: false, status: 'failed', error: 'Payment not found' }];
                    }
                    // 2. Only proceed if status allows verification
                    if (!['unconfirmed'].includes(payment.status)) {
                        return [2 /*return*/, {
                                success: true,
                                status: payment.status,
                                error: "Payment in ".concat(payment.status, " state")
                            }];
                    }
                    retryCount = payment.retry_count || 0;
                    timeSinceCreated = Date.now() - new Date(payment.created_at).getTime();
                    hoursElapsed = timeSinceCreated / (1000 * 60 * 60);
                    if (!(hoursElapsed > 24 && retryCount > 100)) return [3 /*break*/, 4];
                    return [4 /*yield*/, supabase_1.supabase
                            .from('payments')
                            .update({
                            status: 'needs_review',
                            last_verified_at: new Date().toISOString(),
                            flags: flags.concat(['long_pending', 'requires_manual_review'])
                        })
                            .eq('id', paymentId)];
                case 3:
                    _f.sent();
                    return [2 /*return*/, {
                            success: false,
                            status: 'needs_review',
                            error: 'Payment requires manual review after extended pending period',
                            flags: ['long_pending']
                        }];
                case 4:
                    provider = new ethers_1.JsonRpcProvider("https://rpcv2-testnet.ancient8.gg");
                    tx = void 0, receipt = void 0;
                    _f.label = 5;
                case 5:
                    _f.trys.push([5, 7, , 9]);
                    return [4 /*yield*/, Promise.all([
                            provider.getTransaction(payment.tx_hash).catch(function () { return null; }),
                            provider.getTransactionReceipt(payment.tx_hash).catch(function () { return null; })
                        ])];
                case 6:
                    _c = _f.sent(), tx = _c[0], receipt = _c[1];
                    return [3 /*break*/, 9];
                case 7:
                    providerError_1 = _f.sent();
                    // Provider issues shouldn't mark payment as failed
                    return [4 /*yield*/, supabase_1.supabase
                            .from('payments')
                            .update({
                            retry_count: retryCount + 1,
                            last_verified_at: new Date().toISOString(),
                        })
                            .eq('id', paymentId)];
                case 8:
                    // Provider issues shouldn't mark payment as failed
                    _f.sent();
                    return [2 /*return*/, {
                            success: false,
                            status: 'pending',
                            error: 'Provider temporarily unavailable'
                        }];
                case 9:
                    if (!!tx) return [3 /*break*/, 13];
                    if (!(retryCount > 20)) return [3 /*break*/, 11];
                    flags.push('tx_not_found_multiple_attempts');
                    return [4 /*yield*/, supabase_1.supabase
                            .from('payments')
                            .update({
                            status: 'needs_review',
                            retry_count: retryCount + 1,
                            last_verified_at: new Date().toISOString(),
                            flags: flags
                        })
                            .eq('id', paymentId)];
                case 10:
                    _f.sent();
                    return [2 /*return*/, {
                            success: false,
                            status: 'needs_review',
                            error: 'Transaction not found after multiple attempts',
                            flags: flags
                        }];
                case 11: return [4 /*yield*/, supabase_1.supabase
                        .from('payments')
                        .update({
                        retry_count: retryCount + 1,
                        last_verified_at: new Date().toISOString(),
                    })
                        .eq('id', paymentId)];
                case 12:
                    _f.sent();
                    return [2 /*return*/, { success: false, status: 'pending', error: 'Transaction not found' }];
                case 13:
                    if (!(!tx.blockNumber || !receipt)) return [3 /*break*/, 15];
                    // Still pending - normal case
                    return [4 /*yield*/, supabase_1.supabase
                            .from('payments')
                            .update({
                            retry_count: retryCount + 1,
                            last_verified_at: new Date().toISOString(),
                        })
                            .eq('id', paymentId)];
                case 14:
                    // Still pending - normal case
                    _f.sent();
                    return [2 /*return*/, { success: false, status: 'pending', error: 'Transaction not mined yet' }];
                case 15:
                    if (!(receipt.status !== 1)) return [3 /*break*/, 17];
                    // This is a definitive failure - transaction failed on-chain
                    return [4 /*yield*/, supabase_1.supabase
                            .from('payments')
                            .update({
                            status: 'failed',
                            last_verified_at: new Date().toISOString(),
                            flags: ['blockchain_tx_failed']
                        })
                            .eq('id', paymentId)];
                case 16:
                    // This is a definitive failure - transaction failed on-chain
                    _f.sent();
                    return [2 /*return*/, {
                            success: false,
                            status: 'failed',
                            error: 'Transaction failed on blockchain'
                        }];
                case 17: return [4 /*yield*/, provider.getBlockNumber()];
                case 18:
                    currentBlock = _f.sent();
                    confirmations = currentBlock - tx.blockNumber + 1;
                    if (!(confirmations < requiredConfirmations)) return [3 /*break*/, 20];
                    return [4 /*yield*/, supabase_1.supabase
                            .from('payments')
                            .update({
                            retry_count: retryCount + 1,
                            last_verified_at: new Date().toISOString(),
                        })
                            .eq('id', paymentId)];
                case 19:
                    _f.sent();
                    return [2 /*return*/, {
                            success: false,
                            status: 'pending',
                            error: "Waiting for confirmations: ".concat(confirmations, "/").concat(requiredConfirmations)
                        }];
                case 20: return [4 /*yield*/, provider.getBlock(tx.blockNumber)];
                case 21:
                    block = _f.sent();
                    if (!block) {
                        return [2 /*return*/, { error: "Block not found for transaction." }];
                    }
                    txTimestamp = new Date(block.timestamp * 1000);
                    // 8. RELAXED validation - use tolerance and flags instead of hard failures
                    if (payment.amount && payment.to_wallet_address) {
                        expectedAmount = ethers_1.ethers.parseEther(payment.amount.toString());
                        tolerance = payment.tolerance_percentage || 0.01;
                        toleranceAmount = expectedAmount * BigInt(Math.floor(tolerance * 100)) / 100n;
                        amountDiff = tx.value > expectedAmount ?
                            tx.value - expectedAmount : expectedAmount - tx.value;
                        if (amountDiff > toleranceAmount) {
                            // Don't auto-fail, flag for review
                            flags.push('amount_mismatch');
                            flags.push("expected_".concat(ethers_1.ethers.formatEther(expectedAmount), "_got_").concat(ethers_1.ethers.formatEther(tx.value)));
                        }
                        // Recipient validation
                        if (((_d = tx.to) === null || _d === void 0 ? void 0 : _d.toLowerCase()) !== payment.to_wallet_address.toLowerCase()) {
                            flags.push('recipient_mismatch');
                            flags.push("expected_".concat(payment.to_wallet_address, "_got_").concat(tx.to));
                        }
                    }
                    return [4 /*yield*/, supabase_1.supabase
                            .from('payment_sessions')
                            .select('created_at, expires_at')
                            .eq('payment_id', paymentId)
                            .order('created_at', { ascending: false })
                            .limit(1)
                            .single()];
                case 22:
                    _b = _f.sent(), session = _b.data, sessionError = _b.error;
                    if (session && !sessionError) {
                        createdAt = new Date(session.created_at);
                        expiresAt = new Date(session.expires_at);
                        bufferTime = 5 * 60 * 1000;
                        bufferedCreatedAt = new Date(createdAt.getTime() - bufferTime);
                        bufferedExpiresAt = new Date(expiresAt.getTime() + bufferTime);
                        if (txTimestamp < bufferedCreatedAt || txTimestamp > bufferedExpiresAt) {
                            flags.push('timestamp_outside_session');
                            flags.push("tx_time_".concat(txTimestamp.toISOString()));
                            flags.push("session_".concat(createdAt.toISOString(), "_to_").concat(expiresAt.toISOString()));
                        }
                    }
                    finalStatus = 'confirmed';
                    criticalFlags = flags.filter(function (flag) {
                        return flag.includes('amount_mismatch') ||
                            flag.includes('recipient_mismatch');
                    });
                    if (criticalFlags.length > 0) {
                        finalStatus = 'needs_review';
                    }
                    updateData = {
                        status: finalStatus,
                        confirmed_at: finalStatus === 'confirmed' ? new Date().toISOString() : null,
                        block_number: tx.blockNumber,
                        confirmations: confirmations,
                        last_verified_at: new Date().toISOString(),
                        gas_used: (_e = receipt.gasUsed) === null || _e === void 0 ? void 0 : _e.toString(),
                        flags: flags.length > 0 ? flags : null
                    };
                    return [4 /*yield*/, supabase_1.supabase
                            .from('payments')
                            .update(updateData)
                            .eq('id', paymentId)];
                case 23:
                    updateError = (_f.sent()).error;
                    if (updateError) {
                        return [2 /*return*/, {
                                success: false,
                                status: 'pending',
                                error: 'Failed to update payment status'
                            }];
                    }
                    return [2 /*return*/, {
                            success: true,
                            status: finalStatus,
                            txDetails: {
                                blockNumber: tx.blockNumber,
                                confirmations: confirmations,
                                timestamp: txTimestamp,
                                gasUsed: receipt.gasUsed,
                            },
                            flags: flags.length > 0 ? flags : undefined
                        }];
                case 24:
                    err_1 = _f.sent();
                    console.error('verifyTransaction error:', err_1);
                    _f.label = 25;
                case 25:
                    _f.trys.push([25, 29, , 30]);
                    return [4 /*yield*/, supabase_1.supabase
                            .from('payments')
                            .select('retry_count')
                            .eq('id', paymentId)
                            .single()];
                case 26:
                    currentPayment = (_f.sent()).data;
                    if (!currentPayment) return [3 /*break*/, 28];
                    return [4 /*yield*/, supabase_1.supabase
                            .from('payments')
                            .update({
                            retry_count: (currentPayment.retry_count || 0) + 1,
                            last_verified_at: new Date().toISOString(),
                        })
                            .eq('id', paymentId)];
                case 27:
                    _f.sent();
                    _f.label = 28;
                case 28: return [3 /*break*/, 30];
                case 29:
                    retryUpdateError_1 = _f.sent();
                    console.error('Failed to update retry count:', retryUpdateError_1);
                    return [3 /*break*/, 30];
                case 30: return [2 /*return*/, { success: false, status: 'pending', error: 'Internal server error' }];
                case 31: return [2 /*return*/];
            }
        });
    });
}
