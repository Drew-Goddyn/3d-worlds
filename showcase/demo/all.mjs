import pilot from './pilot.mjs';
import assemble from './assemble.mjs';
import verify,{freeze} from './verify.mjs';
export default async function all(options){await options.calibrate();await pilot(options);await freeze(options.scenario,options.out);await options.record('official');await assemble(options);await verify(options);}
