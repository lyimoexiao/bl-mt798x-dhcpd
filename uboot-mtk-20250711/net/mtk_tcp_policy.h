/* SPDX-License-Identifier: GPL-2.0 */
#ifndef __MTK_TCP_POLICY_H__
#define __MTK_TCP_POLICY_H__

/* Four segments in flight keep this no-SACK bootloader stack from flooding
 * a small host/NIC queue. A short nonzero peer window still accepts data. */
static inline unsigned int mtk_tcp_payload_budget(unsigned int pending,
	unsigned int mss, unsigned int peer_window, unsigned int in_flight)
{
	unsigned int flight_limit = 4 * mss;
	unsigned int budget;

	if (!peer_window || in_flight >= flight_limit)
		return 0;
	budget = pending < mss ? pending : mss;
	if (budget > peer_window)
		budget = peer_window;
	if (budget > flight_limit - in_flight)
		budget = flight_limit - in_flight;
	return budget;
}

static inline int mtk_tcp_continue_recovery(int recovering,
	unsigned int sent, unsigned int acked)
{
	return recovering && (int)(sent - acked) > 0;
}

#endif
