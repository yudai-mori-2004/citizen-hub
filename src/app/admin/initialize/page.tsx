/* src/app/admin/initialize/page.tsx */

"use client";

import React, { useEffect, useState } from "react";
import {
  Keypair,
  SystemProgram,
  Transaction,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { Program } from "@coral-xyz/anchor";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";
import { useWallet } from "@/hooks/useWallet";

import {
  connection,
  PROGRAM_ID,
  createProvider,
  getMintStatePDA,
} from "@/lib/solana";
import {
  getMintStateAccount,
} from "@/lib/program";

import idl from "@/lib/idl.json";

import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Settings,
  Coins,
  Key,
  Database,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* types & helpers                                                    */
/* ------------------------------------------------------------------ */

interface InitStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "running" | "completed" | "error";
  result?: string;
  error?: string;
}

const toSOL = (lamports: number) => (lamports / 1e9).toFixed(3) + " SOL";

export default function InitializePage() {
  const { wallet, publicKey, connected } = useWallet();

  const [steps, setSteps] = useState<InitStep[]>([
    { id: "check-wallet", title: "Check Wallet Connection", description: "Verify Phantom wallet is connected", status: "pending" },
    { id: "check-balance", title: "Check SOL Balance", description: "Ensure sufficient SOL for initialization", status: "pending" },
    { id: "create-mint", title: "Create PROS Token Mint", description: "Generate mint keypair (program will create accounts)", status: "pending" },
    { id: "create-vault", title: "Calculate Vault Account", description: "Determine vault ATA address (program will create)", status: "pending" },
    { id: "initialize-program", title: "Initialize Smart Contract", description: "Call initialize_mint on-chain", status: "pending" },
    { id: "verify", title: "Verify Initialization", description: "Confirm everything on-chain", status: "pending" },
  ]);

  const [isInitializing, setIsInitializing] = useState(false);
  const [initConfig, setInitConfig] = useState<any>(null);

  const updateStepStatus = (id: string, status: InitStep["status"], result?: string, error?: string) =>
    setSteps(prev => prev.map(s => s.id === id ? { ...s, status, result, error } : s));

  useEffect(() => {
    if (connected && publicKey) {
      updateStepStatus("check-wallet", "completed", publicKey.toString());
      (async () => {
        updateStepStatus("check-balance", "running");
        try {
          const bal = await connection.getBalance(publicKey);
          if (bal / 1e9 >= 0.1) {
            updateStepStatus("check-balance", "completed", toSOL(bal));
          } else {
            updateStepStatus("check-balance", "error", undefined, `Need ≥0.1 SOL (current ${toSOL(bal)})`);
          }
        } catch {
          updateStepStatus("check-balance", "error", undefined, "RPC error");
        }
      })();
    } else {
      updateStepStatus("check-wallet", "pending");
      updateStepStatus("check-balance", "pending");
    }
  }, [connected, publicKey]);

  const createPROSMint = async () => {
    updateStepStatus("create-mint", "running");
    const mintKeypair = Keypair.generate();
    sessionStorage.setItem("mintKeypair", JSON.stringify(Array.from(mintKeypair.secretKey)));
    updateStepStatus("create-mint", "completed", mintKeypair.publicKey.toString());
    return mintKeypair;
  };

  const calcVaultAccount = async (mintKeypair: Keypair) => {
    updateStepStatus("create-vault", "running");
    const [mintAuthority] = await getMintStatePDA();
    const vaultATA = await getAssociatedTokenAddress(mintKeypair.publicKey, mintAuthority, true);
    updateStepStatus("create-vault", "completed", vaultATA.toString());
    return { mintAuthority, vaultATA };
  };

  const initializeSmartContract = async (mintKeypair: Keypair, mintAuthority: string, vaultATA: string) => {
    updateStepStatus("initialize-program", "running");
    try {
      const provider = createProvider(wallet);
      const program = new Program(idl as any, provider);

      const [mintState] = await getMintStatePDA();

      const ix = await program.methods
        .initializeMint()
        .accounts({
          mintState,
          mint: mintKeypair.publicKey,
          vaultTokenAccount: vaultATA,
          admin: publicKey!,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .instruction();

      const tx = new Transaction()
        .add(ComputeBudgetProgram.setComputeUnitLimit({ units: 100_000 }))
        .add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000 }))
        .add(ix);

      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = publicKey ?? undefined;

      const signedTx = await wallet?.signTransaction(tx);
      signedTx.partialSign(mintKeypair);

      const sig = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(sig, "confirmed");

      updateStepStatus("initialize-program", "completed", sig);
    } catch (e: any) {
      updateStepStatus("initialize-program", "error", undefined, e.message);
      throw e;
    }
  };

  const verify = async () => {
    updateStepStatus("verify", "running");
    try {
      const acc = await getMintStateAccount(wallet);
      if (acc) {
        updateStepStatus("verify", "completed", `Authority: ${acc.authority.toString()}`);
      } else {
        updateStepStatus("verify", "error", undefined, "Not found");
      }
    } catch (e: any) {
      updateStepStatus("verify", "error", undefined, e.message);
    }
  };

  const runInitialization = async () => {
    if (!wallet || !publicKey || !connected) {
      alert("Connect Phantom first");
      return;
    }

    setSteps(prev => prev.map(s => ({
      ...s,
      status: s.id === "check-wallet" ? "completed" : "pending",
      result: s.id === "check-wallet" ? publicKey.toString() : undefined,
      error: undefined,
    })));
    setIsInitializing(true);
    sessionStorage.removeItem("mintKeypair");

    try {
      const mintKeypair = await createPROSMint();
      const { mintAuthority, vaultATA } = await calcVaultAccount(mintKeypair);
      await initializeSmartContract(mintKeypair, mintAuthority.toString(), vaultATA.toString());
      await verify();

      setInitConfig({
        programId: PROGRAM_ID.toString(),
        mint: mintKeypair.publicKey.toString(),
        mintAuthority: mintAuthority.toString(),
        vaultTokenAccount: vaultATA.toString(),
        initializedBy: publicKey.toString(),
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsInitializing(false);
    }
  };

  const StepIcon = ({ status }: { status: InitStep["status"] }) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "running": return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case "error": return <AlertCircle className="w-5 h-5 text-red-600" />;
      default: return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const colorByStatus = (s: InitStep["status"]) => ({
    completed: "border-green-200 bg-green-50",
    running: "border-blue-200 bg-blue-50",
    error: "border-red-200 bg-red-50",
    pending: "border-gray-200 bg-gray-50",
  } as Record<string, string>)[s];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Settings size={24} /> CitizenHub Program Initialization
              </CardTitle>
              <p className="text-muted-foreground">
                Initialize the PROS token and smart contract for the first time.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <Badge variant="outline" className="flex items-center gap-2">
                  <Key size={14} /> Program: {PROGRAM_ID.toString()}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-2">
                  <Database size={14} /> Network: DevNet
                </Badge>
              </div>

              {!connected ? (
                <p className="text-center text-muted-foreground py-8">Connect your Phantom wallet to begin.</p>
              ) : (
                <>
                  <div className="space-y-4">
                    {steps.map((st, i) => (
                      <div key={st.id} className={`p-4 rounded-lg border-2 ${colorByStatus(st.status)}`}>
                        <div className="flex items-start gap-3">
                          <StepIcon status={st.status} />
                          <div className="flex-1">
                            <h3 className="font-medium text-sm">{i + 1}. {st.title}</h3>
                            <p className="text-sm text-muted-foreground">{st.description}</p>
                            {st.result && <p className="text-xs text-green-700 mt-2 font-mono">✓ {st.result}</p>}
                            {st.error && <p className="text-xs text-red-700 mt-2">✗ {st.error}</p>}
                          </div>
                        </div>
                      </div>
                    ))}

                    <Button onClick={runInitialization} disabled={isInitializing} className="w-full">
                      {isInitializing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Initializing…</> : <><Coins className="w-4 h-4 mr-2" /> Start Initialization</>}
                    </Button>
                  </div>

                  {initConfig && (
                    <Card className="mt-6 bg-green-50 border-green-200">
                      <CardHeader>
                        <CardTitle className="text-lg text-green-800">🎉 Initialization Successful!</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div><strong>PROS Mint:</strong> {initConfig.mint}</div>
                        <div><strong>Mint Authority:</strong> {initConfig.mintAuthority}</div>
                        <div><strong>Vault Account:</strong> {initConfig.vaultTokenAccount}</div>
                        <div><strong>Initialized By:</strong> {initConfig.initializedBy}</div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
