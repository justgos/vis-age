import axios from 'axios';
import protobuf from 'protobufjs';

const getProto = async () => {
  const protoDef = await axios.get('./proto/visage.proto');
  const proto = protobuf.parse(protoDef.data).root as any;
  return proto;
};

export const loadProto = async <T extends any>(protoClass : string, url : string) => {
  const proto = await getProto();
  const contentBin = await axios.get(url, { responseType: 'arraybuffer' });
  const content = proto[protoClass].decode(new Uint8Array(contentBin.data)) as T;
  return content;
}
