/* SPDX-License-Identifier: GPL-2.0 */
#include <assert.h>
#include <stdio.h>
#include "../../uboot-mtk-20250711/net/mtk_tcp_policy.h"

int main(void)
{
	assert(mtk_tcp_payload_budget(315885, 1460, 1460, 0) == 1460);
	assert(mtk_tcp_payload_budget(315885, 1460, 512, 0) == 512);
	assert(mtk_tcp_payload_budget(315885, 1460, 0, 0) == 0);
	assert(mtk_tcp_payload_budget(315885, 1460, 262144, 5840) == 0);
	assert(mtk_tcp_payload_budget(315885, 1460, 262144, 5800) == 40);
	assert(mtk_tcp_payload_budget(525, 1460, 262144, 0) == 525);
	/* Reproduce the capture: ACK advances but is still far behind sent. */
	assert(mtk_tcp_continue_recovery(1, 316096, 114091));
	assert(mtk_tcp_continue_recovery(1, 316096, 115551));
	assert(!mtk_tcp_continue_recovery(1, 316096, 316096));
	assert(!mtk_tcp_continue_recovery(0, 316096, 115551));
	/* Sequence arithmetic across the 32-bit wrap. */
	assert(mtk_tcp_continue_recovery(1, 1000, 0xfffffff0U));
	puts("TCP policy tests passed: small/exact/zero windows, bounded flight, continuing recovery.");
	return 0;
}
