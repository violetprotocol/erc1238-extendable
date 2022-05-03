import { expect } from "chai";

export function shoulMintLikeBadge(): void {
  it("should return zero balance", async function () {
    console.log("this", this);
    expect(await this.badgeAsIBalanceGetters.balanceOf(this.admin.address, 1)).to.equal(0);
  });
}
