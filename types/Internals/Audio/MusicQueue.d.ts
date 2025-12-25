export = MusicQueue;
declare class MusicQueue extends EventEmitter<any> {
    constructor(guildId: any);
    guildId: any;
    tracks: any[];
    currentTrack: any;
    loop: boolean;
    loopQueue: boolean;
    volume: number;
    filters: {
        bassboost: boolean;
        nightcore: boolean;
        vaporwave: boolean;
        "8d": boolean;
    };
    add(track: any): number;
    addNext(track: any): number;
    remove(index: any): any;
    next(): any;
    shuffle(): void;
    clear(): void;
    setLoop(mode: any): void;
    setVolume(vol: any): void;
    setFilter(filter: any, enabled: any): boolean;
    get isEmpty(): boolean;
    get size(): number;
    get totalDuration(): any;
    getPage(page?: number, perPage?: number): {
        tracks: any[];
        page: number;
        totalPages: number;
        total: number;
    };
}
import { EventEmitter } from "node:events";
//# sourceMappingURL=MusicQueue.d.ts.map