# Votegrity

Votegrity is a web-based voting system
that automates multiple choice voting by secret ballot
in a way that no single person can compromise the voting process
(in particular there's no need to trust the adminsitrator of the webserver
and the administrator of the e-mail system).

There are two properties of the voting process
that votegrity ensures (together we'll call them **integrity**):

1. **Secrecy**: nobody except for the voter knows how he/she voted
   unless the voter explicitly allows this information to be disclosed.

2. **Transparency** that consists of three parts:
    * Every voter can see how his/her ballot was counted,
    * Everyone sees the list of all voters,
    * Everyone sees the list of all ballots
      (but doesn't see who filled which ballot because of secrecy).

Votegrity uses cryptography
and distributes responsibilities between two administrators
in such a way that integrity will hold
unless they conspire to defeat the system.

At the moment the system is in the concept stage.

## Conceptual outline

This section explains the theoretical foundation of the system
without going much into technical detail.

### Definitions

* **Moderator** is the first administrator of the election,
* **Counter** is the second administrator of the election,
* **Voter** is a person taking place in the election,
* **Server** is the part of the software that runs on the votegrity server,
* **Client** is the part of the software that runs in the browser,
* **Key pair** is a pair of RSA public and private keys
  that can be used encryption and signing.
* **Token** is sufficiently long string of numbers that it cannot be
  guessed.
* **Ballot** is a data structure containing a ballot token,
  the list of voting options
  and optionally a selection of one or more options.
* **Filled ballot** is a ballot plus voter token and the vote.

### Assumptions

The security of the system rests on the following assumptions:

1. Moderator and counter don't conspire to defeat the system.
2. For any key pair, data encrypted with a public key
   can only be read using the private key.
3. For any key pair and any string of data, using the private key
   it's possible to produce the signature of the data
   so that it can be verified using the public key
   and cannot be produced without the private key.
4. The server is not compromised in a way that the data is lost
   (modifying the data would be noticed
   and no protected information is stored on the server unencrypted
   so other types of compromises or malicious actions
   by people having physical access to the server are not significant).
5. We can trust the integrity of the client
   (even though it's delivered to the browser by the server,
   it's unobfuscated javascript so it can be inspected
   and verified to be authentic; we try to make such inspection as
   simple as possible in practice).
6. When tokens are generated in the process it's not possible
   for anyone to predict which string was generated.

### Voting procedure

The list below outlines the steps of the voting procedure.
We will use "he" instead of "he/she" for brevity.
Whenever anything is published on the server
it becomes available to all participants of the process.
N denotes the number of voters.

1. Moderator uses the client to generate a key pair. He stores the
   private part securely and the public part is published on the server.
2. Counter generates the key pair the same way.
3. Moderator generates N authentication tokens,
   encrypts each of them with his own public key,
   matches encrypted tokens with names of voters,
   signs the list and publishes it on the server.
4. Counter generates N ballot tokens, uses them to create empty ballots,
   signs each ballot, encrypts it with moderator's public key and
   publishes all ballots to the server.
5. Moderator decrypts the ballots, generates the mapping of voters
   to ballots, encrypts it with his public key and stores on the server.
6. Moderator sends one ballot to each voter via e-mail
   in accordance with the mapping
   together with their authentication token (decrypted);
   the whole bundle is signed.
7. The voter enters the information into the client,
   the client checks signatures of counter and moderator
   and that authentication token is one of the valid tokens
   on the list (encrypt it with moderator's public key, compare),
   the voter enters his vote into the client,
   the voter generates voter token using the client and stores it securely,
   filled ballot is produced,
   filled ballot is encrypted with the public key of the counter,
   encrypted filled ballot is sent to the moderator
   together with authentication token (HOW?).
8. The moderator checks that authentication token
   and updates the voter list marking the voter as "voted".
9. The moderator stores filled ballot on the server
   (it's still encrypted with the public key of the counter).
10. Counter signs the ballot and publishes the signature next to it.
11. After the election is over the counter decrypts all filled ballots
    and publishes signed list of voter tokens with the corresponding votes
    and the final results.
12. Voters check that their vote was counted via the voter token
    that only they know belongs to them.

### Analysis

This section will explain how integrity is preserved through all steps of the process.

### Implementation

This section will explain the technical details of implementing the voting procedure
as an IT system.