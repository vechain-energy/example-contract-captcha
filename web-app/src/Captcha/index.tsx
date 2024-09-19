import React from 'react';
import { APP_DESCRIPTION, APP_TITLE, CAPTCHA_SITE_KEY, CONTRACT_ADDRESS, NODE_URL, BACKEND_SIGNER_URL } from '~/config';
import { useWallet, useConnex } from '@vechain/dapp-kit-react';
import Transaction from './Transaction';
import ErrorMessage from '~/common/Error';
import { clauseBuilder, FunctionFragment } from '@vechain/sdk-core';
import { Turnstile } from '@marsidev/react-turnstile'
import { decodeRevertReason } from '@vechain/sdk-network/src/thor-client/gas/helpers/decode-evm-error';

export default function Captcha() {
    // get the connected wallet
    const { account } = useWallet();

    // and access to connex for interaction with vechain
    const connex = useConnex()

    // track captcha status for simple UI status display
    const [catpchaStatus, setCaptchaStatus] = React.useState('loading')

    // track captcha token for backend verification
    const [captchaToken, setCaptchaToken] = React.useState('')
    const handleCaptchaSuccess = (token: string) => {
        setCaptchaStatus('solved')
        setCaptchaToken(token)
    }

    // state for sending status
    const [isLoading, setIsLoading] = React.useState(false)
    const [txId, setTxId] = React.useState<string>('')
    const [error, setError] = React.useState<string>('')
    const handleSend = async () => {
        setIsLoading(true)
        try {
            setError('')

            const captchaValidation = await fetch(`${BACKEND_SIGNER_URL}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: captchaToken
                })
            }).then(res => res.json()) as {
                dataHash: string,
                signature: string,
                signer: string,
                validAfter: number,
                validBefore: number
            }

            const clauses = [
                {
                    ...clauseBuilder.functionInteraction(
                        CONTRACT_ADDRESS,
                        'function executeWithAuthorization(bytes32 dataHash,uint256 validAfter,uint256 validBefore,bytes calldata signature, address requiredSigner)' as unknown as FunctionFragment,
                        [
                            captchaValidation.dataHash,
                            captchaValidation.validAfter,
                            captchaValidation.validBefore,
                            captchaValidation.signature,
                            captchaValidation.signer
                        ]
                    ),
                    value: '0x0',
                }
            ]

            const [simulationResult] = await fetch(`${NODE_URL}/accounts/*`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ clauses })
            }).then(res => res.json()) as [{ data: string, reverted: boolean }]

            // prevent transaction if simulation already failed
            if (simulationResult.reverted) {
                // Decode the error message from the simulation result
                const decodedError = decodeRevertReason(simulationResult.data);
                throw new Error(decodedError)
            }

            // build a transaction for the given clauses
            const tx = connex.vendor.sign('tx', clauses)

                // requesting a specific signer will prevent the user from changing the signer to another wallet than the signed in one, preventing confusion
                .signer(account)

            // ask the user to sign the transaction
            const { txid } = await tx.request()

            // the resulting transaction id is stored to check for its status later
            setTxId(txid)
        }
        catch (err) {
            setError(String(err))
        }
        finally {
            setIsLoading(false)
        }
    }


    if (!account) { return 'Please connect your wallet to continue.' }

    return (
        <div className='space-y-8 max-w-lg'>
            <div className='space-y-4'>
                <div className='text-xl font-semibold'>{APP_TITLE}</div>
                <p className='font-thin text-sm'>{APP_DESCRIPTION}</p>
            </div>

            <hr />

            <div className='space-y-4'>
                <Turnstile
                    options={{
                        // adjust the size to your needs, invisible will even hide the widget
                        size: 'invisible',
                    }}
                    siteKey={CAPTCHA_SITE_KEY}
                    onError={() => setCaptchaStatus('error')}
                    onExpire={() => setCaptchaStatus('expired')}
                    onSuccess={handleCaptchaSuccess}
                />

                <div className="font-mono text-xs">Captcha Status: {catpchaStatus}</div>
                <div className="font-mono text-xs">Captcha Token: {captchaToken}</div>
            </div>

            <hr />

            <div>
                <button
                    className={`w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 ${isLoading ? 'opacity-25' : ''}`}
                    disabled={isLoading}
                    onClick={handleSend}
                >
                    Transact with Contract
                </button>
            </div>

            {Boolean(error) && <ErrorMessage>{error}</ErrorMessage>}
            <Transaction txId={txId} />
        </div>
    )
}