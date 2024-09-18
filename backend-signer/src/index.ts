import { encodeBytes32String, decodeBytes32String, ethers, TypedDataEncoder } from 'ethers';

export default {
	async fetch(request, env): Promise<Response> {
		console.log(env)
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		};

		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		if (request.method === 'POST') {
			const { token, validAfter, validBefore } = await request.json() as { token: string, validAfter: number, validBefore: number }

			const res = await fetch(env.VERIFY_ENDPOINT, {
				method: 'POST',
				body: `secret=${encodeURIComponent(env.CAPTCHA_SITE_SECRET_KEY)}&response=${encodeURIComponent(token)}`,
				headers: {
					'content-type': 'application/x-www-form-urlencoded'
				}
			})

			const data = await res.json() as any

			if (data.success) {
				const dataHash = ethers.keccak256(ethers.toUtf8Bytes(token))
				const signer = new ethers.Wallet(env.SIGNER_PRIVATE_KEY);
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

				const value = {
					dataHash,
					validAfter,
					validBefore
				};

				const signature = await signer.signTypedData(domain, types, value);
				return new Response(JSON.stringify({
					dataHash,
					signature,
					signer: signer.address
				}), {
					status: 200,
					headers: {
						...corsHeaders,
						'content-type': 'application/json'
					}
				})
			}

			return new Response(JSON.stringify(data), {
				status: 400,
				headers: {
					...corsHeaders,
					'content-type': 'application/json'
				}
			})
		}

		return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
	},
} satisfies ExportedHandler<Env>;
