# Description of algorithm used for bracket generation

We support 3 base types of stage:
- single elimination brackets
- double elimination brackets
- round robin / swiss round

## Round Robin generation

What should be supported:
- Every team plays against every other team
- There is a maximum number of round, but every team plays a match in each round
- There is a maximum number of round and a maximum number of match in each round

```
type MatchRR {
    opponents: string; //team id
    nextMatch: number[];
    scores?: number[];

}

export class RR {
    rounds: number;
    match_per_round: number;
    matches: MatchRR[][];

    
    constructor(max_match_per_round: number) {
        rounds = max_match_per_round;
        match_per_round = max_match_per_round;
        matches = Array(max_match_per_round);
    }
    constructor(rounds: number, match_per_round: number) {
        this.rounds = rounds;
        this.match_per_round = match_per_round;
        matches = Array(rounds, match_per_round);
    }
    constructor(rounds: number, match_per_round: number, matches: MatchRR[][]) {
        Check size of matches is correct

        this.rounds = rounds;
        this.match_per_round: number;
        this.matches = matches;
    }
}

func generate_rr(t_id: int, t_match_size: int, opponents: team[], match_per_round: int, rounds: int): void {
    if (opponents.length % t_match_size != 0) return error
    
    max_matchs_per_round = opponents.length / t_match_size

    if (match_per_round != null && rounds != null) { 
        if (match_per_round > max_match_per_round) return error
        if (rounds > max_match_per_round) return error

        not implemented
    } else if (match_per_round != null) {
        if (match_per_round > max_match_per_round) return error

        not implemented
    } else {
        possible_opponents: string[], an array with an entry for each team holding the set of remaining opponents

        rr = RR(max_match_per_round);

        randomly generate the first rr.match_per_round matches
        
        update possible_opponents such that team x in match against teams (y_1 to y_{t_match_size}) can't fight them again

        for (i = 1...rr.rounds) {
            opps: set<string> set of team's id for every team in tournament

            for (j = 0...rr.match_per_round) {
                store t_match_size team from opps in t1, t2, t3 and remove them from the set.

                
            } 
        }
    }
}
```