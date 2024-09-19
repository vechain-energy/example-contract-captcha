import { ethers } from 'ethers';

export default {
	async fetch(request, env): Promise<Response> {
		// Adjust cors headers for your security needs
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		};

		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		if (request.method === 'POST') {

			// get captcha payload from web-app
			const { token } = await request.json() as { token: string }

			// verify the captcha on CloudFlare Turnstile
			const captchaVerification = await fetch(env.VERIFY_ENDPOINT, {
				method: 'POST',
				body: `secret=${encodeURIComponent(env.CAPTCHA_SITE_SECRET_KEY)}&response=${encodeURIComponent(token)}`,
				headers: { 'content-type': 'application/x-www-form-urlencoded' }
			}).then(res => res.json()) as TurnstileServerValidationResponse

			// if captcha verification failed, return error
			// optionally improve verification, for example by checking the hostname or time of the challenge
			if (!captchaVerification.success) {
				return new Response(JSON.stringify(captchaVerification), {
					status: 400,
					headers: { ...corsHeaders, 'content-type': 'application/json' }
				})
			}

			// define the timestamps between which the message will be valid
			// `validAfter` needs to point to the latest block, which can be up to 10 seconds in the past.
			const validAfter = Math.floor(Date.now() / 1000) - 10
			const validBefore = Math.floor(Date.now() / 1000) + env.SIGNING_MAX_EXPIRY_SECONDS

			// calculate a bytes32 hash for the CAPTCHA token as unique identifier to be used in the contracts
			const dataHash = ethers.keccak256(ethers.toUtf8Bytes(token))

			// define the EIP712 domain and types for the smart contract
			const domain = {
				name: env.CONTRACT_DOMAIN,
				version: env.CONTRACT_VERSION,
				chainId: env.NETWORK_CHAIN_ID,
				verifyingContract: env.CONTRACT_ADDRESS
			};

			const types = {
				VerifyHash: [
					{ name: "dataHash", type: "bytes32" },
					{ name: "validAfter", type: "uint256" },
					{ name: "validBefore", type: "uint256" }
				]
			};

			const value = { dataHash, validAfter, validBefore };

			// sign the typed data using a privyte key
			const signer = new ethers.Wallet(env.SIGNER_PRIVATE_KEY);
			const signature = await signer.signTypedData(domain, types, value);

			// .. and return all necessary data to the web application
			return new Response(JSON.stringify({
				validAfter,
				validBefore,
				dataHash,
				signature,
				signer: signer.address
			}), {
				headers: { ...corsHeaders, 'content-type': 'application/json' }
			})

		}

		// fallback error
		return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
	},
} satisfies ExportedHandler<Env>;
