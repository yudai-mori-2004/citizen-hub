use anchor_lang::prelude::*;
use anchor_spl::token::{
    self, Mint, MintTo, Token, TokenAccount, Transfer,
};
use anchor_lang::error::ErrorCode; 
use anchor_spl::associated_token::AssociatedToken;


declare_id!("GcwrHG7nXB2Tz9P2GcwYfvgTvMdN3vkVWBhMzvEsZfhk");

// ─────────────────────────────────────────────
// アカウント構造体
// ─────────────────────────────────────────────

#[account]
pub struct MintState {
    pub authority: Pubkey,
    pub bump: u8,
}
impl MintState {
    pub const LEN: usize = 32 + 1;
}

#[account]
pub struct ProposalHash {
    pub proposal_id: Pubkey,
    pub data_hash: [u8; 32],
    pub proposer: Pubkey,
    pub finalized: bool,
    pub bump: u8,
}
impl ProposalHash {
    pub const LEN: usize = 32 + 32 + 32 + 1 + 1;
}

#[account]
pub struct DepositAccount {
    pub user: Pubkey,
    pub proposal: Pubkey,
    pub amount: u64,
    pub claimed: bool,
    pub bump: u8,
}
impl DepositAccount {
    pub const LEN: usize = 32 + 32 + 8 + 1 + 1;
}

// ─────────────────────────────────────────────
//  エラー
// ─────────────────────────────────────────────
#[error_code]
pub enum CitizenErr {
    #[msg("Stake already claimed")]
    AlreadyClaimed,
    #[msg("Not authorized")]
    NotAuthorized,
    #[msg("Invalid outcome")]
    InvalidOutcome,
    #[msg("Proposal already finalized")]
    AlreadyFinalized,
    #[msg("Numerical overflow")]
    NumericalOverflow,
}

// ─────────────────────────────────────────────
//  プログラム
// ─────────────────────────────────────────────
#[program]
pub mod citizenhub_program {
    use super::*;

    // ① MintState + SPLMint + Vault ATA を作成
    pub fn initialize_mint(ctx: Context<InitializeMintCtx>) -> Result<()> {
        let state = &mut ctx.accounts.mint_state;
        state.authority = ctx.accounts.admin.key();
        state.bump = ctx.bumps.mint_state;
        Ok(())
    }

    // ② PROS 発行
    pub fn mint_to(ctx: Context<MintToCtx>, amount: u64) -> Result<()> {
        let seeds = &[b"mint_state_v2".as_ref(), &[ctx.accounts.mint_state.bump]];
        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint:      ctx.accounts.mint.to_account_info(),
                    to:        ctx.accounts.recipient.to_account_info(),
                    authority: ctx.accounts.mint_state.to_account_info(), // ← PDA
                },
                &[seeds],
            ),
            amount,
        )?;
        Ok(())
    }

    // ③ ハッシュ登録
    pub fn register_proposal(
        ctx: Context<RegisterProposalCtx>,
        data_hash: [u8; 32],
    ) -> Result<()> {
        let p = &mut ctx.accounts.proposal;
        p.proposal_id = p.key(); 
        p.data_hash = data_hash;
        p.proposer = ctx.accounts.proposer.key();
        p.finalized = false;
        p.bump = ctx.bumps.proposal;
        Ok(())
    }

    // ④ ステーク（提案）
    pub fn stake_for_proposal(ctx: Context<StakeProposalCtx>, amount: u64) -> Result<()> {
        transfer_to_vault(
            &ctx.accounts.depositor,
            &ctx.accounts.depositor_token_account,
            &ctx.accounts.vault_token_account,
            &ctx.accounts.token_program,
            amount,
        )?;
        upsert_deposit(
            &mut ctx.accounts.deposit,
            ctx.accounts.depositor.key(),
            ctx.accounts.proposal.key(),
            ctx.bumps.deposit,
            amount,
        )
    }

    // ⑤ ステーク（投票）
    pub fn stake_for_vote(ctx: Context<StakeVoteCtx>, amount: u64) -> Result<()> {
        require!(
            ctx.accounts.voter.key() != ctx.accounts.proposal.proposer,
            CitizenErr::NotAuthorized
        );
        transfer_to_vault(
            &ctx.accounts.voter,
            &ctx.accounts.depositor_token_account,
            &ctx.accounts.vault_token_account,
            &ctx.accounts.token_program,
            amount,
        )?;
        upsert_deposit(
            &mut ctx.accounts.deposit,
            ctx.accounts.voter.key(),
            ctx.accounts.proposal.key(),
            ctx.bumps.deposit,
            amount,
        )
    }

    // ⑥ finalize（batched send）
    // remaining_accounts: [deposit PDA (writable), user ATA (writable)] × n
    pub fn finalize_distribution<'info>(
        ctx: Context<'_, '_, 'info, 'info, FinalizeCtx<'info>>,
        outcome: VoteOutcome,
    ) -> Result<()> {
        let _ = outcome;                              // まだ使わない

        require!(!ctx.accounts.proposal.finalized, CitizenErr::AlreadyFinalized);

        let seeds_state  = &[b"mint_state".as_ref(), &[ctx.accounts.mint_state.bump]];

        // 残余アカウントを Vec に clone（ここで ctx との借用関係を断ち切る）
        let rem = ctx.remaining_accounts;

        for pair in rem.chunks(2) {
            let dep_ai = &pair[0];   // Vec 内なので参照で十分
            let ata_ai = &pair[1];

            require!(dep_ai.is_writable, CitizenErr::NotAuthorized);

            let mut deposit: Account<DepositAccount> = Account::try_from(dep_ai)?;
            if deposit.claimed { continue; }

            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.vault_token_account.to_account_info(),
                        to:   ata_ai.clone(),            // AccountInfo は Clone 可
                        authority: ctx.accounts.mint_state.to_account_info(),
                    },
                    &[seeds_state],
                ),
                deposit.amount,
            )?;

            deposit.claimed = true;
        }

        ctx.accounts.proposal.finalized = true;
        Ok(())
    }


}

// ─────────────────────────────────────────────
// 内部関数
// ─────────────────────────────────────────────
fn transfer_to_vault<'info>(
    signer: &Signer<'info>,
    from: &Account<'info, TokenAccount>,
    vault: &Account<'info, TokenAccount>,
    token_program: &Program<'info, Token>,
    amount: u64,
) -> Result<()> {
    let cpi_ctx = CpiContext::new(
        token_program.to_account_info(),
        Transfer {
            from: from.to_account_info(),
            to: vault.to_account_info(),
            authority: signer.to_account_info(),
        },
    );
    token::transfer(cpi_ctx, amount)?;
    Ok(())
}

fn upsert_deposit(
    deposit: &mut Account<DepositAccount>,
    user: Pubkey,
    proposal: Pubkey,
    expected_bump: u8,
    amount: u64,
) -> Result<()> {
    if deposit.amount == 0 {
        // 初回は bump をまだ持っていないので比較しない
        deposit.user     = user;
        deposit.proposal = proposal;
        deposit.bump     = expected_bump;
    } else {
        // 既存 PDA を悪用していないかを確認
        require!(deposit.bump == expected_bump, CitizenErr::NotAuthorized);
    }

    deposit.amount = deposit
        .amount
        .checked_add(amount)
        .ok_or(CitizenErr::NumericalOverflow)?;   // ← ②
    Ok(())
}

// ─────────────────────────────────────────────
// Contexts
// ─────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeMintCtx<'info> {
    #[account(init, payer = admin, space = 8 + MintState::LEN,
        seeds=[b"mint_state_v2"], bump)]
    pub mint_state: Account<'info, MintState>,

    #[account(
        init,
        payer = admin,
        mint::decimals = 6,
        mint::authority = mint_state,
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = admin,
        associated_token::mint = mint,
        associated_token::authority = mint_state
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
pub struct MintToCtx<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub recipient: Account<'info, TokenAccount>,

    #[account(seeds=[b"mint_state_v2"], bump = mint_state.bump)]
    pub mint_state: Account<'info, MintState>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RegisterProposalCtx<'info> {
    #[account(init, payer = proposer, space = 8 + ProposalHash::LEN,
        seeds=[b"proposal", proposal_seed.key().as_ref()], bump)]
    pub proposal: Account<'info, ProposalHash>,
    pub proposal_seed: Signer<'info>,
    #[account(mut)]
    pub proposer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StakeProposalCtx<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,
    #[account(mut)]
    pub proposal: Account<'info, ProposalHash>,

    #[account(
        init_if_needed,
        payer = depositor,
        space = 8 + DepositAccount::LEN,
        seeds=[b"deposit", depositor.key().as_ref(), proposal.key().as_ref()],
        bump
    )]
    pub deposit: Account<'info, DepositAccount>,

    #[account(mut)]
    pub depositor_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StakeVoteCtx<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,
    #[account(mut)]
    pub proposal: Account<'info, ProposalHash>,

    #[account(
        init_if_needed,
        payer = voter,
        space = 8 + DepositAccount::LEN,
        seeds=[b"deposit", voter.key().as_ref(), proposal.key().as_ref()],
        bump
    )]
    pub deposit: Account<'info, DepositAccount>,

    #[account(mut)]
    pub depositor_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FinalizeCtx<'info> {
    #[account(mut)]
    pub proposal: Account<'info, ProposalHash>,

    #[account(seeds = [b"mint_state"], bump = mint_state.bump)]
    pub mint_state: Account<'info, MintState>,

    #[account(mut, address = mint_state.authority)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
}

// 投票結果
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq, Eq)]
pub enum VoteOutcome {
    Approved,
    Rejected,
}
