
import { supabase } from '@/integrations/supabase/client';

export interface EtherscanTokenInfo {
  contractAddress: string;
  tokenName: string;
  symbol: string;
  divisor: string;
  tokenType: string;
  totalSupply: string;
  blueCheckmark: string;
  description: string;
  website: string;
  email: string;
  blog: string;
  reddit: string;
  slack: string;
  facebook: string;
  twitter: string;
  bitbucket: string;
  github: string;
  telegram: string;
  wechat: string;
  linkedin: string;
  discord: string;
  whitepaper: string;
  tokenPriceUSD: string;
}

export interface EtherscanSupplyData {
  status: string;
  message: string;
  result: string;
}

export const fetchTokenSupply = async (contractAddress: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-etherscan-data', {
      body: {
        module: 'stats',
        action: 'tokensupply',
        contractaddress: contractAddress
      }
    });

    if (error) {
      console.error('Error fetching token supply:', error);
      return null;
    }

    const supplyData = data?.data as EtherscanSupplyData;
    return supplyData?.result || null;
  } catch (error) {
    console.error('Error calling Etherscan token supply function:', error);
    return null;
  }
};

export const fetchTokenInfo = async (contractAddress: string): Promise<EtherscanTokenInfo | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-etherscan-data', {
      body: {
        module: 'token',
        action: 'tokeninfo',
        contractaddress: contractAddress
      }
    });

    if (error) {
      console.error('Error fetching token info:', error);
      return null;
    }

    const tokenData = data?.data?.result;
    return tokenData?.[0] || null;
  } catch (error) {
    console.error('Error calling Etherscan token info function:', error);
    return null;
  }
};

export const fetchAccountBalance = async (address: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-etherscan-data', {
      body: {
        module: 'account',
        action: 'balance',
        address: address,
        tag: 'latest'
      }
    });

    if (error) {
      console.error('Error fetching account balance:', error);
      return null;
    }

    const balanceData = data?.data as EtherscanSupplyData;
    return balanceData?.result || null;
  } catch (error) {
    console.error('Error calling Etherscan balance function:', error);
    return null;
  }
};

export const fetchERC20TokenTransfers = async (
  contractAddress: string,
  address?: string,
  startBlock?: number,
  endBlock?: number,
  page: number = 1,
  offset: number = 100
): Promise<any[] | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-etherscan-data', {
      body: {
        module: 'account',
        action: 'tokentx',
        contractaddress: contractAddress,
        address: address,
        startblock: startBlock || 0,
        endblock: endBlock || 99999999,
        page,
        offset,
        sort: 'desc'
      }
    });

    if (error) {
      console.error('Error fetching token transfers:', error);
      return null;
    }

    return data?.data?.result || null;
  } catch (error) {
    console.error('Error calling Etherscan token transfers function:', error);
    return null;
  }
};
