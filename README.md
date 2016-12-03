# Die unendliche Wahl (the never ending election)

This is a demo application for an online election based on the Ethereum Blockchain.
It's related to the notorious [Austrian presidential election 2016](https://en.wikipedia.org/wiki/Austrian_presidential_election,_2016   Austrian _Bundespräsidentenwahl 2016_) which suffered of various issues.

This application is first of all a technical pilot for gaining some experience with the Ethereum platform.
It also contains some thoughts on E-Voting / online voting more in general.

In order to just see it in action, go to http://die-unendliche-wahl.at

In order to take a deeper look or run it yourself, first look into the blockchain directory, then the admin directory, and finally the app directory.
This code was tested on Ubuntu 14.04. It should be easy to get it running on other Linux distributions and probably also on other Unix OS (e.g. OSX).

## What it does

The web application shows what a simple online election may look like.
When the application is loaded, the browser creates an Ethereum wallet and connects to the Blockchain.
It also generated a random token.

Authentication is currently only a dummy form, it would require connecting to an electronic voter registration service.
That service would check if the person is allowed to vote. If so, the browser would blind (encrypt) the token and send it to the service which would sign and return it.
The browser would now unblind the token, resulting in a signed token.

Now the voter can cast her vote on a ballot which is designed the way paper ballots look in Austria.
The choice is translated to a string identifier (in this case 'vdb' or 'hofer') which is then encrypted with a public key using the Web Crypto API.
The associated private key is known to the election committee. Thus the encrypted vote can't be decrypted by anybody else.
The encrypted vote is published to the Blockchain alongside with the aforementioned token.
The smart contract would check the signature (not yet implemented) and make sure the token wasn't yet used (instead it could also override the previous vote if that's preferred).

The voter is now forwarded to the result view. As long as the election hasn't closed, a list of recent voting transactions is shown.
Via Ethereum's event mechanism, the application can that way get near realtime notifications of interactions with the smart contract.
The list elements contain block number and transaction hash, hyperlinked to a Blockchain Explorer.

Once the election closes, the final result is shown in a simple chart.
Tallying is implemented in an off-chain script to be run by the admin (election committee).
Encrypted votes are fetched from the Blockchain, decrypted and counted.
The final result is pushed to the Blockchain (as json string), along with the private key, allowing everybody to verify te result.
Tallying could also be implemented in a smart contract, but I didn't find a good reason to do so.

## Why

First of all, this application is for people who got used to this election to never end. It gives them an opportunity to keep voting forever ;-)

On a more serious note, it's for exploring the topic of online voting in the context of Blockchain.

The research done along the way suggests that modern crypto + blockchain allow building E-Voting systems which combine high transparency and privacy.
While a purely blockchain based implementation would be possible with a versatile platform like Ethereum, it's probably not the best solution.
Some issues with that approach:
* scalability: the transaction throughput of current public Blockchains isn't enough for high volume elections
* coercion resistance: Transactions are associated to accounts. Voters can proof an account is theirs by showing the associated private key)
* privacy: voter anonimity could be compromised by Blockchain nodes logging IP addresses of connecting clients

An ideal implementation would probably do most operations off-chain, on traditional servers.
One could for example imagine a platform similar to Helios Voting, distributed such that not all voters have to connect to the same server.
With the right cryptography in place, such a system can be made [end-to-end auditable](https://en.wikipedia.org/wiki/End-to-end_auditable_voting_systems),
mitigating one of the strongest criticisms of E-Voting systems.
The voter would still need to trust the server operator not to compromise privacy (e.g. by logging IPs). Possible mitigations:
* Active prevention e.g. by the voter using Tor (which could even be built into the voting client software)
* Distributed system of multiple servers, reflecting the structure of traditional paper voting systems. Advantages:
** A compromised server could cause only limited damage. E.g. a server logging IPs would be comparable to the risk a voting booth being equipped with a spy camera. In both cases only a limited number of voters would be affected
** Voter can have a more direct relationship to the operator, they may know each other, which is good for trust. In an Online-Voting-context the voter may even have the option to choose an operator she trusts.

The role of the Blockchain in such a system could be limited to that of a bulletin board.
If every vote is pushed to a Blockchain (of course in encrypted form) additionally, it becomes much easier for everybody to verify that the election results contain all votes.

Coercion resistance could be achieved by using zero-knowledge-proofs.
If the election committee publishes a cryptographic proof for the alleged result, it doesn't need to publish the private key for vote decryption.

## Why not

The main remaining problem is that of end user device security.
With an E2E-auditable system that could be somewhat mitigated by the fact that manipulations could be detected.
More robust protections could be implemented via dedicated hardware and/or very strong requirements for allowed end user devices.

## Conclusion

Some forms of online voting may already today be more secure then postal voting.
Paper ballots are fine for the current applications, but a barrier for new forms of democratic partecipation.
Recent developments in Cryptography and Blockchain technology make online voting a topic worth keeping an eye on.