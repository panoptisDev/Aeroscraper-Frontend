import GradientButton from '@/components/Buttons/GradientButton';
import SkeletonLoading from '@/components/Table/SkeletonLoading';
import { Table } from '@/components/Table/Table';
import { TableBodyCol } from '@/components/Table/TableBodyCol';
import { TableHeaderCol } from '@/components/Table/TableHeaderCol';
import { useNotification } from '@/contexts/NotificationProvider';
import { useWallet } from '@/contexts/WalletProvider';
import useAppContract from '@/contracts/app/useAppContract';
import { requestRiskyTroves } from '@/services/graphql';
import { RiskyTroves } from '@/types/types';
import { getIsInjectiveResponse, convertAmount, getRatioColor } from '@/utils/contractUtils';
import { getCroppedString } from '@/utils/stringUtils';
import React, { FC, useCallback, useEffect, useState } from 'react'
import { NumericFormat } from 'react-number-format';
import { PageData } from '../../../_types/types';
import Text from '@/components/Texts/Text';
import { RocketIcon } from '@/components/Icons/Icons';

type Props = {
  pageData: PageData;
  getPageData: () => void;
  basePrice: number;
}

const RiskyTrovesTab: FC<Props> = ({ pageData, getPageData, basePrice }) => {

  const { baseCoin } = useWallet();
  const contract = useAppContract();
  const [loading, setLoading] = useState(false);
  const [processLoading, setProcessLoading] = useState<boolean>(false);
  const [riskyTroves, setRiskyTroves] = useState<RiskyTroves[]>([]);
  const { addNotification } = useNotification();

  const liquidateTroves = async () => {
    try {
      setProcessLoading(true);
      const res = await contract.liquidateTroves();
      addNotification({
        status: 'success',
        directLink: getIsInjectiveResponse(res) ? res?.txHash : res?.transactionHash,
        message: 'Risky Troves Successfully Liquidated.'
      });
      getPageData();
      getRiskyTroves();
    }
    catch (err) {
      console.error(err);
      addNotification({
        message: "",
        status: 'error',
        directLink: ""
      })
    }
    finally {
      setProcessLoading(false);
    }
  }

  const getRiskyTroves = useCallback(async () => {
    try {
      setLoading(true);
      const res = await requestRiskyTroves();
      const getTrovesPromises = res.troves.nodes.map<Promise<RiskyTroves>>(async item => {
        try {
          const troveRes = await contract.getTroveByAddress(item.owner);
          return {
            owner: item.owner,
            liquidityThreshold: item.liquidityThreshold,
            collateralAmount: convertAmount(troveRes?.collateral_amount ?? 0, baseCoin?.decimal),
            debtAmount: convertAmount(troveRes?.debt_amount ?? 0, baseCoin?.ausdDecimal)
          }
        }
        catch (err) {
          return {
            owner: item.owner,
            liquidityThreshold: item.liquidityThreshold,
            collateralAmount: 0,
            debtAmount: 0
          }
        }
      })
      const data = await Promise.all(getTrovesPromises);
      setRiskyTroves(data);
    }
    catch (err) {
      console.error(err);
    }
    finally {
      setLoading(false);
    }
  }, [contract, baseCoin])

  useEffect(() => {
    getRiskyTroves();
  }, [getRiskyTroves])

  return (
    <div>
      <Text size='3xl' className='mb-4'>Liquidate Risky Troves</Text>
      <div className='-ml-4'>
        <Table
          listData={riskyTroves}
          header={<div className="grid-cols-6 grid gap-5 lg:gap-0 mt-4">
            <TableHeaderCol col={3} text="Owner" />
            <TableHeaderCol col={1} text="Collateral" textCenter />
            <TableHeaderCol col={1} text="Debt" textCenter />
            <TableHeaderCol col={1} text="Coll. Ratio" />
          </div>}
          bodyCss='space-y-1 max-h-[350px] overflow-auto'
          renderItem={(item: RiskyTroves) => {
            return loading ?
              <>
                {
                  Array.from(Array(2).keys()).map(
                    item => <SkeletonLoading key={item} height='h-5' />
                  )
                }
              </>
              :
              <div className="grid grid-cols-6 border-b border-white/10">
                <TableBodyCol col={3} text="XXXXXX" value={
                  <Text size='sm' className='whitespace-nowrap text-start ml-4'>{getCroppedString(item.owner, 6, 8)}</Text>
                } />
                <TableBodyCol col={1} text="XXXXXX" value={
                  <NumericFormat
                    value={item.collateralAmount}
                    thousandsGroupStyle="thousand"
                    thousandSeparator=","
                    fixedDecimalScale
                    decimalScale={2}
                    displayType="text"
                    renderText={(value) =>
                      <Text size='sm' responsive={false} className='whitespace-nowrap'>{value} {baseCoin?.name}</Text>
                    }
                  />} />
                <TableBodyCol col={1} text="XXXXXX" value={
                  <NumericFormat
                    value={item.debtAmount}
                    thousandsGroupStyle="thousand"
                    thousandSeparator=","
                    fixedDecimalScale
                    decimalScale={2}
                    displayType="text"
                    renderText={(value) =>
                      <Text size='sm' responsive={false} className='whitespace-nowrap'>{value} AUSD</Text>
                    }
                  />} />
                <TableBodyCol col={1} text="XXXXXX" value={
                  <NumericFormat
                    value={item.liquidityThreshold}
                    thousandsGroupStyle="thousand"
                    thousandSeparator=","
                    fixedDecimalScale
                    decimalScale={2}
                    displayType="text"
                    renderText={(value) =>
                      <Text size='sm' responsive={false} className='whitespace-nowrap text-end' dynamicTextColor={getRatioColor(((item.liquidityThreshold ?? 0) * (basePrice ?? 0))) ?? 0}>{Number((item.liquidityThreshold ?? 0) * (basePrice ?? 0)).toFixed(3)}%</Text>
                    }
                  />}
                />
              </div>
          }} />
      </div>
      {riskyTroves.length === 0 && (
        <div className='my-10'>
          <RocketIcon className='w-5 h-5 text-red-500 mx-auto' />
          <Text size='base' className='whitespace-nowrap text-center mt-6'>Risky troves list is empty</Text>
        </div>
      )}
      <GradientButton
        disabled={riskyTroves.length === 0}
        className='w-[374px] h-11 ml-auto mt-6'
        onClick={liquidateTroves}
        rounded="rounded-lg"
        loading={processLoading}
      >
        Liquidate Risky Troves
      </GradientButton>
    </div>
  )
}

export default RiskyTrovesTab