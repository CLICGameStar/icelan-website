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
func generate_rr(t_id: int, t_match_size: int, opponents: team[], match_per_round: int, rounds: int): void {
    if (opponents.length % t_match_size != 0) return error
    
    max_matchs_per_round = opponents.length / t_match_size

    if (match_per_round != null && rounds != null) { 
        if (match_per_round > max_match_per_round) return error
        if (rounds > max_match_per_round) return error

    } else if (match_per_round != null) {
        if (match_per_round > max_match_per_round) return error

    } else {
        create an array possible_opponents with an entry for each team holding the set of remaining opponents

        create an array of matches matches of size max_match_per_round * rounds
        
        randomly generate the first set of matches (matches[0] to matches[max_matches_per_round])
        
        update possible_opponents such that team x in match against teams (y_1 to y_{t_match_size}) can't fight them again

        
    }
}
```