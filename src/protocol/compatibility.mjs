/**
 * Pure, dependency-free client/server protocol compatibility gate.
 * A mismatch must never silently permit score or clock writes.
 */
export function checkCompatibility(client, server) {
  if (!client || !server || typeof client !== 'object' || typeof server !== 'object') {
    return {writable:false,reason:'Missing version information'};
  }
  const valid = x => Number.isSafeInteger(x) && x >= 1;
  if (!valid(client.protocol) || !valid(server.protocol)) {
    return {writable:false,reason:'Invalid protocol version'};
  }
  if (client.protocol !== server.protocol) {
    return {writable:false,reason:'Protocol mismatch; read-only until upgraded'};
  }
  if (client.gameId && server.gameId && client.gameId !== server.gameId) {
    return {writable:false,reason:'Wrong game session'};
  }
  if (server.maintenance === true) {
    return {writable:false,reason:'Mac service maintenance; manual control required'};
  }
  return {writable:true,reason:'Compatible protocol'};
}
