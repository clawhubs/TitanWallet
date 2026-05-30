import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function normalizeChunkName(input: string) {
  return input.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase()
}

function getPackageNameFromNodeModules(id: string) {
  const marker = '/node_modules/'
  const markerIndex = id.lastIndexOf(marker)
  const parts = markerIndex >= 0 ? id.slice(markerIndex + marker.length).split('/') : []

  if (parts[0]?.startsWith('@') && parts[1]) {
    return `${parts[0].slice(1)}-${parts[1]}`
  }

  return parts[0] || null
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1800,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('/node_modules/')) {
            return
          }

          if (id.includes('/node_modules/@privy-io/react-auth/dist/esm/')) {
            if (id.includes('/index-')) {
              return 'privy-core'
            }

            if (
              id.includes('Screen-') ||
              id.includes('Form-') ||
              id.includes('View-') ||
              id.includes('/ModalHeader-') ||
              id.includes('/TodoList-') ||
              id.includes('/JsonTree-') ||
              id.includes('/WalletInfoCard-') ||
              id.includes('/PinInput-') ||
              id.includes('/GooglePay-') ||
              id.includes('/NetworkIcon-') ||
              id.includes('/TransactionDetails-') ||
              id.includes('/CopyableText-')
            ) {
              return 'privy-flows'
            }

            if (id.includes('/ui.mjs') || id.includes('/styles-') || id.includes('/Screen')) {
              return 'privy-ui'
            }

            if (id.includes('/prepareTransactionRequest-') || id.includes('/transaction-')) {
              return 'privy-transaction'
            }

            if (
              id.includes('/context-') ||
              id.includes('/internal-context-') ||
              id.includes('/privy-context-') ||
              id.includes('/modal-context-') ||
              id.includes('/internal.mjs') ||
              id.includes('/frame-') ||
              id.includes('/paths-') ||
              id.includes('/pkce-')
            ) {
              return 'privy-context'
            }

            if (
              id.includes('/usePrivy-') ||
              id.includes('/useWallets-') ||
              id.includes('/useActiveWallet-') ||
              id.includes('/use-export-wallet-') ||
              id.includes('/use-deposit-address-') ||
              id.includes('/use-sign-with-user-signer-') ||
              id.includes('/use-unlink-wallet-')
            ) {
              return 'privy-hooks'
            }

            if (id.includes('/wallet-connect-')) {
              return 'privy-wallet-connect'
            }

            if (id.includes('/smart-wallets') || id.includes('/abstract-smart-wallets')) {
              return 'privy-smart-wallets'
            }

            if (id.includes('/solana.mjs') || id.includes('/useSolanaRpcClient-')) {
              return 'privy-solana'
            }
          }

          if (id.includes('/node_modules/viem/') || id.includes('/node_modules/ox/')) {
            return 'viem'
          }

          if (
            id.includes('/node_modules/@solana/') ||
            id.includes('/node_modules/@solana-program/')
          ) {
            return 'solana'
          }

          if (id.includes('/node_modules/ethers/') || id.includes('/node_modules/@noble/')) {
            return 'ethers-vendor'
          }

          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/react-router-dom/') ||
            id.includes('/node_modules/scheduler/')
          ) {
            return 'react-vendor'
          }

          if (id.includes('/node_modules/zustand/')) {
            return 'state'
          }

          const packageName = getPackageNameFromNodeModules(id)

          if (packageName) {
            return `vendor-${normalizeChunkName(packageName)}`
          }

          return 'vendor'
        },
      },
      onLog(level, log, defaultHandler) {
        const isDependencyAnnotationWarning =
          level === 'warn' &&
          log.code === 'INVALID_ANNOTATION' &&
          typeof log.id === 'string' &&
          log.id.includes('/node_modules/')

        if (isDependencyAnnotationWarning) {
          return
        }

        defaultHandler(level, log)
      },
    },
  },
})
