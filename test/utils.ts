import { utils } from "ethers";

import * as interfaces from "./interfaces";

// Taken from OpenZeppeling test-helpers
// https://github.com/OpenZeppelin/openzeppelin-test-helpers/blob/a7c3af4192fd0ad2a61a4ebac66097f5b5934e92/src/makeInterfaceId.js
export const getERC165InterfaceId = (functionSignatures: string[] = []) => {
  const INTERFACE_ID_LENGTH = 4;

  const interfaceIdBuffer = functionSignatures
    .map(signature => utils.keccak256(utils.toUtf8Bytes(signature)))
    .map(
      h => Buffer.from(h.substring(2), "hex").slice(0, 4), // bytes4()
    )
    .reduce((memo, bytes) => {
      for (let i = 0; i < INTERFACE_ID_LENGTH; i++) {
        memo[i] = memo[i] ^ bytes[i]; // xor
      }
      return memo;
    }, Buffer.alloc(INTERFACE_ID_LENGTH));

  const interfaceId = `0x${interfaceIdBuffer.toString("hex")}`;

  return interfaceId;
};

const checkInterfaceId = async (contract: any, interfaceName: keyof typeof interfaces) => {
  const interfaceId = getERC165InterfaceId(interfaces[interfaceName]);

  const isInterfaceSupported = await contract.supportsInterface(interfaceId);

  if (!isInterfaceSupported) throw new Error(`Unsupported interfaceId`);

  return isInterfaceSupported;
};

export const shouldSupportInterfaces = async (contract: any, interfaceNames: (keyof typeof interfaces)[]) => {
  try {
    const res = await Promise.all(interfaceNames.map(interfaceName => checkInterfaceId(contract, interfaceName)));

    if (res.find(p => p.status === "rejected") !== undefined) return false;

    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};
