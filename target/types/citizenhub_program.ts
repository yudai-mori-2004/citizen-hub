/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/citizenhub_program.json`.
 */
export type CitizenhubProgram = {
  "address": "GcwrHG7nXB2Tz9P2GcwYfvgTvMdN3vkVWBhMzvEsZfhk",
  "metadata": {
    "name": "citizenhubProgram",
    "version": "0.1.0",
    "spec": "0.1.0"
  },
  "instructions": [
    {
      "name": "finalizeDistribution",
      "discriminator": [
        12,
        246,
        59,
        197,
        66,
        128,
        169,
        197
      ],
      "accounts": [
        {
          "name": "proposal",
          "writable": true
        },
        {
          "name": "mintState",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  116,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "vaultTokenAccount",
          "writable": true
        },
        {
          "name": "mint"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "outcome",
          "type": {
            "defined": {
              "name": "voteOutcome"
            }
          }
        }
      ]
    },
    {
      "name": "initializeMint",
      "discriminator": [
        209,
        42,
        195,
        4,
        129,
        85,
        209,
        44
      ],
      "accounts": [
        {
          "name": "mintState",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  116,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "mint",
          "writable": true,
          "signer": true
        },
        {
          "name": "vaultTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "mintState"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": []
    },
    {
      "name": "mintTo",
      "discriminator": [
        241,
        34,
        48,
        186,
        37,
        179,
        123,
        192
      ],
      "accounts": [
        {
          "name": "mint",
          "writable": true
        },
        {
          "name": "recipient",
          "writable": true
        },
        {
          "name": "mintState",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  116,
                  95,
                  115,
                  116,
                  97,
                  116,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "registerProposal",
      "discriminator": [
        255,
        112,
        186,
        111,
        67,
        158,
        20,
        87
      ],
      "accounts": [
        {
          "name": "proposal",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  112,
                  111,
                  115,
                  97,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "proposalSeed"
              }
            ]
          }
        },
        {
          "name": "proposalSeed",
          "signer": true
        },
        {
          "name": "proposer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "dataHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "stakeForProposal",
      "discriminator": [
        119,
        185,
        96,
        179,
        187,
        48,
        14,
        49
      ],
      "accounts": [
        {
          "name": "depositor",
          "writable": true,
          "signer": true
        },
        {
          "name": "proposal",
          "writable": true
        },
        {
          "name": "deposit",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  112,
                  111,
                  115,
                  105,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "depositor"
              },
              {
                "kind": "account",
                "path": "proposal"
              }
            ]
          }
        },
        {
          "name": "depositorTokenAccount",
          "writable": true
        },
        {
          "name": "vaultTokenAccount",
          "writable": true
        },
        {
          "name": "mint"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "stakeForVote",
      "discriminator": [
        160,
        54,
        63,
        212,
        164,
        246,
        227,
        31
      ],
      "accounts": [
        {
          "name": "voter",
          "writable": true,
          "signer": true
        },
        {
          "name": "proposal",
          "writable": true
        },
        {
          "name": "deposit",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  101,
                  112,
                  111,
                  115,
                  105,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "voter"
              },
              {
                "kind": "account",
                "path": "proposal"
              }
            ]
          }
        },
        {
          "name": "depositorTokenAccount",
          "writable": true
        },
        {
          "name": "vaultTokenAccount",
          "writable": true
        },
        {
          "name": "mint"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "depositAccount",
      "discriminator": [
        148,
        37,
        207,
        116,
        61,
        33,
        53,
        179
      ]
    },
    {
      "name": "mintState",
      "discriminator": [
        81,
        17,
        143,
        120,
        23,
        57,
        22,
        117
      ]
    },
    {
      "name": "proposalHash",
      "discriminator": [
        69,
        233,
        137,
        171,
        7,
        89,
        156,
        6
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "alreadyClaimed",
      "msg": "Stake already claimed"
    },
    {
      "code": 6001,
      "name": "notAuthorized",
      "msg": "Not authorized"
    },
    {
      "code": 6002,
      "name": "invalidOutcome",
      "msg": "Invalid outcome"
    },
    {
      "code": 6003,
      "name": "alreadyFinalized",
      "msg": "Proposal already finalized"
    },
    {
      "code": 6004,
      "name": "numericalOverflow",
      "msg": "Numerical overflow"
    }
  ],
  "types": [
    {
      "name": "depositAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "proposal",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "claimed",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "mintState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "proposalHash",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "proposalId",
            "type": "pubkey"
          },
          {
            "name": "dataHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "proposer",
            "type": "pubkey"
          },
          {
            "name": "finalized",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "voteOutcome",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "approved"
          },
          {
            "name": "rejected"
          }
        ]
      }
    }
  ]
};
