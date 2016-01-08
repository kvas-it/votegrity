# Votegrity

[![Build Status](https://travis-ci.org/kvas-it/votegrity.svg?branch=master)](https://travis-ci.org/kvas-it/votegrity)

Votegrity is a web-based electronic voting system
that automates voting by secret ballot
in a way that no single person can compromise the voting process.

There are three properties of the voting process that votegrity ensures
(together we'll call them **integrity**):

1. **Secrecy**: nobody except for the voter knows if and how he/she voted
   unless the voter explicitly allows this information to be disclosed.

2. **Transparency** that consists of three parts:
    * Every voter can see how his/her ballot was counted,
    * Everyone sees the list of all eligible voters,
    * Everyone sees the list of all cast votes
      (but doesn't see who cast which vote because this would violate secrecy).

3. **Authenticity**: all votes in the final count are cast by one of the eligible voters,
   not more than one vote per voter.

Votegrity uses cryptography
and distributes responsibilities between two administrators
in such a way that integrity will hold
unless the two administrators conspire to defeat the system

Note: _Administrators of the e-mail system can also conspire with the counter_.

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
* **Ballot** is a data structure containing a ballot token issued by the counter
  and the list of voting options.
* **Filled ballot** is a ballot plus voter token and the vote
  (selection from the list of voting options).
  The vote and the voter token are encrypted with the public key of the counter.

### Assumptions

The security of the system rests on the following assumptions:

1. For any key pair, data encrypted with a public key
   can only be read using the private key.
2. For any key pair and any (sufficiently long) string of data,
   it's possible to produce the signature of the data using the private key 
   so that it can be verified using the public key
   and cannot be produced without the private key.
3. When tokens are generated in the process it's not possible
   for anyone to predict which string was generated.
4. Moderator and counter don't conspire to defeat the system.
5. E-mail administrators and the counter don't conspire to defeat the system.
6. Users can trust the integrity of the client
   (even though it's delivered to the browser by the server,
   it's unobfuscated javascript so it can be inspected
   and verified to be authentic; we try to make such inspection as
   simple as possible).

### Voting procedure

The basic idea behind the voting procedure is as follows:

* Counter issues ballots,
* Moderator distributes them to the voters, one to each,
* Voters submit filled ballots to the moderator
  with the vote readable only by the counter,
* The moderator passes all the filled ballots to the counter
  who calculates and publishes the results.

Below we outline the procedure in more detail
explaining which information is exchanged at each step.
The analysis will follow.

We will use "he" instead of "he/she" for brevity.
Whenever anything is _published_ on the server
it becomes available to all participants of the process.
When something is _stored_ on the server, it becomes available
to the moderator and other parties if specified.
N denotes the number of voters.

1. Moderator uses the client to generate a key pair. He stores the
   private part securely and the public part is published on the server.
2. Counter generates the key pair the same way.
3. Moderator generates N authentication tokens,
   encrypts each of them with his own public key,
   matches encrypted tokens with names of voters,
   signs the list and publishes it on the server.
4. Counter generates N ballot tokens, uses them to create empty ballots,
   signs each ballot and publishes all ballots on the server.
5. Moderator generates the mapping of authentication tokens to ballots
   and stores each ballot on the server
   protected by its respective authentication token.
6. Moderator sends one authentication token to each voter via e-mail
   in accordance with the list from step 3.
7. The voter enters his authentication token into the client,
   the client checks that the token is one of the tokens from the list,
   retrieves the ballot from the server,
   checks that it's one of the ballots from the list,
   the voter enters his vote into the client,
   the voter generates voter token using the client and stores it securely,
   filled ballot is produced and stored on the server.
8. The server checks the correctness of filled ballot,
   updates the used ballot token list marking the ballot token "used".
9. After the election is over the moderator collects all used ballots
   and publishes them on the server signing the whole package.
10. The counter receives the filled ballots
   and publishes signed list of voter tokens with the corresponding votes
   and the final results.

The following scheme illustrates the flow of information during the steps:

	      Counter             Moderator            Server             Voter
	
	3.                SM([EM(AT[i]) + V[i]]) -----> <P>

    4.   SC([B[i]]) ------------------------------> <P>

    5.                         [ B[i] ----------> <AT[i]> ]

    6.                          AT[i] ---------- e-mail --------------> *
  
    7.                                               * <------------- AT[i]
                                                    B[i] -------------> *
                                                     * <------------- FB[i]

    8.                                       BT[i]+"used" -> <P>

    9.                           [ * <------------- FB[i] ]
                              SM([FB[i]]) --------> <P>
 
    10.  SM([FB[i]]) <------------------------------ *
       [VT[i] + VV[i]] ---------------------------> <P>

Notation:

* Data
  * ``AT[i]`` -- Authentication token,
  * ``V[i]`` -- Voter information of one voter,
  * ``VT[i]`` -- Voter token,
  * ``VV[i]`` -- Vote,
  * ``B[i]`` -- Ballot (consisting of a ballot token and information about voting),
  * ``FB[i]`` -- Filled ballot (``B[i] + EC(VT[i] + VV[i])``),
  * ``[X[i]]`` -- the full list of Xs (e.g. all authentication tokens),
* Encryption and signatures:
  * ``SM(...)`` -- Information signed by moderator,
  * ``EM(...)`` -- Information encrypted with moderator's public key,
  * ``SC(...)`` -- Information signed by counter,
  * ``EC(...)`` -- Information encrypted with counter's public key,
* Storage on the server:
  * ``<P>`` -- Information is publicly accessible,
  * ``<AT[i]>`` -- Information is accessible to those who posses the right access token.
  * The storing operations are denoted with arrows,
  * Storing operations in square brackets denote storage of all items of the kind.

### Analysis

#### Secrecy

Secrecy is preserved because only the voter and the counter can see the content
of a filled ballot. However, the counter has no way to know which ballot belongs
to whom. The mapping of ballots to voters is only known to the moderator and
the only information inside of the filled ballot that is associated with the voter
is the voter token that is only known to the voter.

The moderator knows who voted and who didn't,
so this part of the information has a weaker secrecy than the vote itself.
We need to have the possibility to cast an empty ballot
for the voters who want more privacy with the question of whether they voted or not.

#### Transparency

The voter can see how his/her vote is counted at step 9.
The open list of results contains voter tokens that are known to respective voters.

Everyone sees the list of all voters after it's published by the moderator at step 3.

All the votes cast can be seen by everyone after step 9.

#### Authenticity

There are two options for violating authenticity:
adding an extra vote and modifying a vote cast by one of the voters.
First one is not possible because the number of the votes cast is visible
during and after the election
and each voter can check if the ballot that they received was used.
Second is not possible because the voter whose vote was changed would see the
change in the final results.

A voter can only cast one vote because they have only one ballot available to them.

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

#### Server side storage (a.k.a. key-value store)

The server can store and retrieve some data for the clients.
The storage is implemented as a simple key-value store.
Its API is implemented on top of HTTP(S) POST requests
and request parameters are encoded in the POST body.
This is simpler than using a proper REST-API,
which would expose us to caching issues
and require proper authentication and sessions.

The API has two calls:
 
* ``read(key, accessToken)`` -- Returns the content of the store bucket
  associated with the key.

* ``write (key, accessToken, content)`` -- Replaces the content of the bucket
  associated with the key with provided content.
  Returns success code.

Both calls check the access token and return error responses
if the token does not allow access to the bucket.

The data is stored on the disk in one folder with files
and the access is synchronised by the server (only one write at a time,
reads only if there's no write).

The access to the key-value store is controlled at the level of the web service.
The data that defines access consists of the user list
and access control lists (ACLs) for individual keys.
All of those lists are also stored in the key-value store.

##### User list

User list is stored at the key ``users`` and contains information
about users including name, e-mail, double hashed security token
and their role (one of ``voter``, ``counter`` or ``moderator``).
The format of the lines is similar to unix ``/etc/passwd`` file:

    <htoken>:<email>:<name>:<role>
    # Lines starting with hash are ignored
 
User list is readable by all authenticated users and writable by the moderator. 

##### ACLs

ACL for any key is stored as ``<key>.acl``.
For example the ACL for the user list is stored as ``users.acl``.
The ACL consists of the lines that contain user hashed token
or role followed by access mode ``read``, ``write``, ``write-once(<timestamp>)``.

    <htoken-or-role>:<access-mode>

There can be more than one entry that applies to the same user.
Access is granted if any one of them would grant access.
Moderator is always given full access to all keys.
Everyone else has no access unless explicitly allowed by the ACL.

### Architecture

#### Server

We use a minimal server based on node.js that provides the key-value store
and a number of static pages that can include some of the values
and contain the code and templates of the client.

In production the server is reverse-proxied with nginx or apache that
can serve static files and provide HTTPS-termination.

#### Client

There are client applications for moderator, counter and voter.
Each of them is a single page web app that includes cryptico library
and common base library that performs necessary cryptographic tasks
and talks to the server.