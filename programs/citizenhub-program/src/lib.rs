use anchor_lang::prelude::*;

// プログラムの ID をここへ埋め込む（anchor build 後に書き換え）
declare_id!("CLGiHLTiggu1bPa91aGUtP3viTxqmSe2FNa3gzh4goEU");

#[program]
pub mod citizenhub_program {
    use super::*;

    // initialize 関数：単純に初回呼び出し用
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let base_account = &mut ctx.accounts.base_account;
        base_account.data = 0;
        Ok(())
    }

    // increment 関数：カウンターをインクリメント
    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        let base_account = &mut ctx.accounts.base_account;
        base_account.data += 1;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 8)]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(mut)]
    pub base_account: Account<'info, BaseAccount>,
}

#[account]
pub struct BaseAccount {
    pub data: u64,
}