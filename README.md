# Votegrity

Votegrity is a web-based voting system
that automates multiple choice voting by secret ballot
in a way that no single person can compromise the voting process
(in particular there's no need to trust the administrators of the e-mail system).

There are three properties of the voting process that votegrity ensures
(together we'll call them **integrity**):

1. **Secrecy**: nobody except for the voter knows how he/she voted
   unless the voter explicitly allows this information to be disclosed.

2. **Transparency** that consists of three parts:
    * Every voter can see how his/her ballot was counted,
    * Everyone sees the list of all voters,
    * Everyone sees the list of all votes
      (but doesn't see who case which vote because this would violate secrecy).

3. **Authenticity**: all votes in the final count are cast by one of the voters.

Votegrity uses cryptography
and distributes responsibilities between two administrators
in such a way that integrity will hold
unless they conspire to defeat the system.

## Conceptual outline

This section explains the theoretical foundation of the system
without going much into technical detail.

### Definitions

* **Container** is a physical or virtual machine
  that is used for running the votegrity software,
* **Server** is the part of the software that runs in the container,
* **Client** is the part of the software that runs in the browser,
* **Moderator** is the first administrator of the election,
  who also controls the container,
* **Counter** is the second administrator of the election,
* **Voter** is any person taking place in the election,
* **Key pair** is a pair of RSA public and private keys
  that can be used encryption and signing.
* **Token** is sufficiently long string of numbers that it cannot be
  guessed.
* **Ballot** is a data structure containing a ballot token and
  the list of voting options.
* **Filled ballot** is a ballot plus voter token and the vote
  (selection from the list of voting options).

### Assumptions

The security of the system rests on the following assumptions:

1. For any key pair, data encrypted with a public key
   can only be read using the private key.
2. For any key pair and any (sufficiently long) string of data,
   it's possible to produce the signature of the data using the private key 
   so that it can be verified using the public key
   and cannot be produced without the private key.
3. Moderator and counter don't conspire to defeat the system.
4. Users can trust the integrity of the client
   (even though it's delivered to the browser by the server,
   it's unobfuscated javascript so it can be inspected
   and verified to be authentic; we try to make such inspection as
   simple as possible).
5. When tokens are generated in the process it's not possible
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
   publishes all ballots on the server.
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
   encrypted filled ballot is submitted to the server
   together with authentication token.
8. The server checks the authentication token,
   updates the voter list marking the voter as "voted" and
   stores the filled ballot
   (it's still encrypted with the public key of the counter).
9. After the election is over the counter receives and decrypts all filled ballots
   and publishes signed list of voter tokens with the corresponding votes
   and the final results.

### Analysis

#### Secrecy

Secrecy is preserved because only the voter and the counter can see the content
of a filled ballot. However, the counter has no way to know which ballot belongs
to whom. The mapping of ballots to voters is only known to the moderator and
the only information inside of the filled ballot that is associated with the voter
is the voter token that is only known to the voter. It's also not possible to match
voters to filled ballots by timing because filled ballots become available
to the counter all at once at the end of election. 

#### Transparency

The voter can see how his/her vote is counted at step 9.
The open list of results contains voter tokens that are known to respective voters.

Everyone sees the list of all voters after it's published by the moderator at step 3.

All the votes cast can be seen by everyone after step 9.

#### Authenticity

There are two options for violating authenticity:
adding an extra vote and modifying a vote cast by one of the voters.
First one is not possible because the number of the votes is visible
during and after the election
and each voter can check if he/she is counted as voted.
Second is not possible because the voter whose vote was changed would see the
change in the final results.

We're relying on voters here to prevent vote injection and falsification,
and one could argue that this is not a very reliable option.
However, if we want to ensure secrecy and to avoid generating key pairs for each voter,
this is basically the only option we have.
Secrecy is not negotiable in the current use case and simplicity for voters is important.
Also authenticity breach can easily be discovered,
which should be a sufficient deterrent against
authenticity breaching by the administrators.
All in all the compromise seems to be acceptable.

## Implementation

### Dependencies

* [cryptico](https://github.com/wwwtyro/cryptico)
  for encryption, signing, hashes, RNG and key generation.

### Foundations

#### Tokens

We use 256-bit random strings whenever we need random tokens. We encode them
with BASE64 to make ASCII-safe and human-readable (this produces 44-character strings).

#### Key generation

We use cryptico for generating key pairs from passwords
instead of randomly generating key pairs.
To ensure adequate level of security we use random tokens for passwords
and don't allow users to choose them. The added benefit is that if a wrong password
is entered later it will be immediately detected because the public key
of the generated key pair will not match the published public key.

#### Encryption

We use cryptico API for encryption and signing.

### Architecture

#### Server

We use a minimal server based on node.js that provides a key-value storage.
Read and write access to keys or key prefixes
is guarded by moderator and counter passwords
or individual authentication tokens.
The access map is stored in the same storage at the "access" key.
It's R/W for moderator.

There's also a number of static pages that can include some of the buckets
and contain the code and templates of the client.

In production the server is reverse-proxied with nginx or apache that
can serve static files and provide HTTPS-termination.

#### Client

There are client applications for moderator, counter and voter.
Each of them is a single page web app that includes cryptico library
and common base library that performs necessary cryptographic tasks
and talks to the server.