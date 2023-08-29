'use client';

import GradientButton from "@/components/Buttons/GradientButton";
import WalletButton from "@/components/Buttons/WalletButton";
import StatisticCard from "@/components/Cards/StatisticCard";
import BorderedContainer from "@/components/Containers/BorderedContainer";
import ShapeContainer from "@/components/Containers/ShapeContainer";
import { InfoIcon, RightArrow } from "@/components/Icons/Icons";
import Text from "@/components/Texts/Text"
import { useCallback, useEffect, useMemo, useState } from "react";
import { NumericFormat } from 'react-number-format'
import TroveModal from "./_components/TroveModal";
import useAppContract from "@/contracts/app/useAppContract";
import { PageData } from "./_types/types";
import { convertAmount } from "@/utils/contractUtils";

import StabilityPoolModal from "./_components/StabilityPoolModal";
import RiskyTrovesModal from "./_components/RiskyTrovesModal";
import { useWallet } from "@/contexts/WalletProvider";
import { getSettledValue } from "@/utils/promiseUtils";
import RedeemSide from "./_components/RedeemSide";
import { requestTotalTroves } from "@/services/graphql";
import Tooltip from "@/components/Tooltip/Tooltip";
import { PriceServiceConnection } from "@pythnetwork/price-service-client";
import Select from "@/components/Select/Select";
import { mockChains } from "./_mock/mock";

export default function Dashboard() {
    const { balanceByDenom, refreshBalance } = useWallet();
    const [troveModal, setTroveModal] = useState(false);
    const [stabilityModal, setStabilityModal] = useState(false);
    const [riskyModal, setRiskyModal] = useState(false);
    const [seiPrice, setSeiPrice] = useState(0);
    const [pageData, setPageData] = useState<PageData>({
        collateralAmount: 0,
        debtAmount: 0,
        ausdBalance: 0,
        stakedAmount: 0,
        totalCollateralAmount: 0,
        totalDebtAmount: 0,
        totalAusdSupply: 0,
        totalStakedAmount: 0,
        totalTrovesAmount: 0,
        poolShare: 0,
        rewardAmount: 0,
        minCollateralRatio: 0,
        minRedeemAmount: 0
    })

    useEffect(() => {
        const getPrice = async () => {
            const connection = new PriceServiceConnection(
                "https://xc-mainnet.pyth.network/",
                {
                    priceFeedRequestConfig: {
                        binary: true,
                    },
                }
            )

            const priceIds = [
                "53614f1cb0c031d4af66c04cb9c756234adad0e1cee85303795091499a4084eb",
            ];

            const currentPrices = await connection.getLatestPriceFeeds(priceIds);

            if (currentPrices) setSeiPrice(Number(currentPrices[0].getPriceUnchecked().price) / 100000000)
        }

        getPrice()
    }, [])

    const isTroveOpened = useMemo(() => pageData.collateralAmount > 0, [pageData]);

    const contract = useAppContract();

    const getPageData = useCallback(async () => {
        try {
            const [
                troveRes,
                ausdBalanceRes,
                stakeRes,
                totalStakeRes,
                totalCollateralRes,
                totalDebtRes,
                ausdInfoRes,
                rewardRes,
                totalTrovesRes
            ] = await Promise.allSettled([
                contract.getTrove(),
                contract.getAusdBalance(),
                contract.getStake(),
                contract.getTotalStake(),
                contract.getTotalCollateralAmount(),
                contract.getTotalDebtAmount(),
                contract.getAusdInfo(),
                contract.getReward(),
                requestTotalTroves()
            ]);

            const collateralAmount = convertAmount(getSettledValue(troveRes)?.collateral_amount ?? 0)
            const debtAmount = convertAmount(getSettledValue(troveRes)?.debt_amount ?? 0)

            setPageData({
                collateralAmount,
                debtAmount,
                ausdBalance: convertAmount(getSettledValue(ausdBalanceRes)?.balance ?? 0),
                stakedAmount: convertAmount(getSettledValue(stakeRes)?.amount ?? 0),
                totalCollateralAmount: convertAmount(getSettledValue(totalCollateralRes) ?? 0),
                totalDebtAmount: convertAmount(getSettledValue(totalDebtRes) ?? 0),
                totalAusdSupply: convertAmount(getSettledValue(ausdInfoRes)?.total_supply ?? 0),
                totalStakedAmount: convertAmount(getSettledValue(totalStakeRes) ?? 0),
                poolShare: Number(Number(getSettledValue(stakeRes)?.percentage).toFixed(3)),
                rewardAmount: convertAmount(getSettledValue(rewardRes) ?? 0),
                minCollateralRatio: (collateralAmount * seiPrice) / (debtAmount || 1),
                minRedeemAmount: seiPrice,
                totalTrovesAmount: getSettledValue(totalTrovesRes)?.troves.totalCount ?? 0
            })
        }
        catch (err) {
            console.error(err);

            setPageData({
                collateralAmount: 0,
                debtAmount: 0,
                ausdBalance: 0,
                stakedAmount: 0,
                totalCollateralAmount: 0,
                totalDebtAmount: 0,
                totalAusdSupply: 0,
                totalStakedAmount: 0,
                poolShare: 0,
                rewardAmount: 0,
                minCollateralRatio: 0,
                minRedeemAmount: 0,
                totalTrovesAmount: 0
            })
        }
    }, [contract, seiPrice])

    useEffect(() => {
        getPageData();
    }, [getPageData])

    return (
        <div>
            <div className="flex justify-end mb-6">
                <Select
                    initialValue={mockChains[0]}
                    data={mockChains}
                    keyExtractor={item => item.id}
                    nameExtractor={item => item.name}
                    renderItem={(item, isSelected) => (
                        <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1">
                                <img alt={item.name} src={item.imageUrl} className="w-8 h-8" />
                                <Text>{item.name}</Text>
                            </div>
                            {isSelected && <img alt="selected" src="/images/tick.svg" />}
                        </div>
                    )}
                    renderSelectedItem={(item) => (
                        <div className="flex items-center gap-1">
                            <img alt={item.name} src={item.imageUrl} className="w-8 h-8" />
                            <Text>{item.name}</Text>
                        </div>
                    )
                    }
                    onSelect={() => { }}
                    width="w-[272px]"
                    height="h-14"
                />
            </div>
            <div className="grid grid-cols-[1fr_439px] gap-6 overflow-hidden">
                <BorderedContainer containerClassName="w-full h-[122px]" className="px-8 py-6 flex justify-between items-center gap-2">
                    <div className="flex items-center gap-11">
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2">
                                <img alt="ausd" className="w-10 h-10" src="/images/ausd.svg" />
                                <Text size="2xl">AUSD</Text>
                            </div>
                            <Text>$1.00</Text>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2">
                                <img alt="ausd" className="w-10 h-10" src="/images/sei.png" />
                                <Text size="2xl">SEI</Text>
                            </div>
                            <Text>$ {seiPrice.toFixed(3)}</Text>
                        </div>
                    </div>
                    <WalletButton ausdBalance={pageData.ausdBalance} seiBalance={Number(convertAmount(balanceByDenom['usei']?.amount ?? 0))} />
                </BorderedContainer>
                <RedeemSide pageData={pageData} getPageData={getPageData} refreshBalance={refreshBalance} />
                <BorderedContainer containerClassName="w-full mt-4" className="p-3">
                    <div className="w-full rounded-lg px-4 py-2">
                        <Text size="2xl" weight="font-normal">Aeroscraper Statics</Text>
                        <div className="flex flex-wrap justify-center gap-6 mt-2 px-4">
                            <StatisticCard
                                title="Management Fee"
                                description="0.5%"
                                className="w-[191px] h-14"
                                tooltip="This amount is deducted from the collateral amount as a management fee. There are no recurring fees for borrowing, which is thus interest-free."
                                tooltipPlacement="top"
                            />
                            <StatisticCard
                                title="TVL"
                                description={`${Number(pageData.totalCollateralAmount).toFixed(3)} SEI`}
                                className="w-[191px] h-14"
                                tooltip="The Total Value Locked (TVL) is the total value of sei locked as collateral in the system."
                                tooltipPlacement="top"
                            />
                            <StatisticCard
                                title="Troves"
                                description={`${pageData.totalTrovesAmount}`}
                                className="w-[191px] h-14"
                                tooltip="The total number of active Troves in the system."
                                tooltipPlacement="top"
                            />
                            <StatisticCard
                                title="AUSD Supply"
                                description={Number(pageData.totalAusdSupply).toFixed(3).toString()}
                                className="w-[191px] h-14"
                                tooltip="The total AUSD minted by the Aeroscraper Protocol."
                                tooltipPlacement="top"
                            />
                            <StatisticCard
                                title="Liquidation Threshold"
                                description="115%"
                                className="w-[191px] h-14"
                                tooltip="Liquidation Threshold Ratio"
                                tooltipPlacement="top"
                            />
                            <StatisticCard
                                title="AUSD in Stability Pool"
                                tooltipPlacement="top"
                                description={Number(pageData.totalStakedAmount).toFixed(3).toString()}
                                className="w-[191px] h-14"
                                tooltip="The total AUSD currently held in the Stability Pool."
                            />
                            <StatisticCard
                                title="Total Collateral Ratio"
                                tooltipPlacement="top"
                                description={`${isFinite(Number(((pageData.totalCollateralAmount * seiPrice) / pageData.totalDebtAmount) * 100)) ? Number(((pageData.totalCollateralAmount * seiPrice) / pageData.totalDebtAmount) * 100).toFixed(3) : 0} %`}
                                className="w-[191px] h-14"
                                tooltip="The ratio of the Dollar value of the entire system collateral at the current SEI:AUSD price, to the entire system debt."
                            />
                        </div>
                    </div>
                </BorderedContainer>
            </div>
            <div key={"stability-pool"} className="flex items-center">
                <ShapeContainer layoutId="trove" className="flex-[3]" width="" height="">
                    <div className='flex flex-col w-full h-full'>
                        <Text size="3xl" weight="font-normal">Trove</Text>
                        <NumericFormat
                            value={pageData.debtAmount}
                            thousandsGroupStyle="thousand"
                            thousandSeparator=","
                            fixedDecimalScale
                            decimalScale={2}
                            displayType="text"
                            renderText={(value) =>
                                <Text weight="font-normal" className="mt-4">
                                    {
                                        isTroveOpened ?
                                            `You borrowed ${value} AUSD`
                                            :
                                            "You haven’t borrowed any AUSD yet."
                                    }
                                </Text>
                            }
                        />
                        <Text size="base" className="mt-2">
                            {
                                isTroveOpened ?
                                    "You can see your trove in here."
                                    :
                                    "You can borrow AUSD by opening a Trove."
                            }
                        </Text>
                        <GradientButton onClick={() => { setTroveModal(true); }} className="w-full max-w-[192px] 2xl:max-w-[221px] h-11 mt-6 2xl:mt-10 ml-auto 2xl:mx-auto" rounded="rounded-lg">
                            <Text>
                                {
                                    isTroveOpened ?
                                        "Show my Trove"
                                        :
                                        "Open Trove"
                                }
                            </Text>
                        </GradientButton>
                    </div>
                </ShapeContainer>
                <ShapeContainer hasAnimation={pageData.rewardAmount > 0} layoutId="stability-pool" className="flex-[3]" width="" height="">
                    <div className='flex flex-col w-full h-full'>
                        <div className="flex flex-row">
                            <Text size="3xl" weight="font-normal">Stability Pool</Text>
                            <Tooltip title={<Text size='base'>If the frame is glowing, you have a claimable reward.</Text>} width='w-[191px]'>
                                <InfoIcon className='text-white w-4 h-4' />
                            </Tooltip>
                        </div>
                        <NumericFormat
                            value={pageData.stakedAmount}
                            thousandsGroupStyle="thousand"
                            thousandSeparator=","
                            fixedDecimalScale
                            decimalScale={2}
                            displayType="text"
                            renderText={(value) =>
                                <Text weight="font-normal" className="mt-4">
                                    You have {Number(value) > 0 ? value : "no"} AUSD in the Stability Pool.
                                </Text>
                            }
                        />
                        {pageData.stakedAmount <= 0 && <Text size="base" className="mt-2">You can earn AUSD rewards by deposting AUSD.</Text>}
                        <GradientButton onClick={() => { setStabilityModal(true); }} className="w-full max-w-[192px] 2xl:max-w-[221px] h-11 mt-6 2xl:mt-10 ml-auto" rounded="rounded-lg">
                            <Text>Enter</Text>
                        </GradientButton>
                    </div>
                </ShapeContainer>
                <ShapeContainer layoutId="risky-troves" className="flex-1 cursor-pointer" width="" height="">
                    <div onClick={() => { setRiskyModal(true); }} className="w-full h-full flex flex-wrap justify-center items-center">
                        <Text size="base" className="whitespace-nowrap">Risky Troves</Text>
                        <RightArrow width="24" height="24" />
                    </div>
                </ShapeContainer>
            </div>

            <TroveModal
                open={troveModal}
                onClose={() => { setTroveModal(false); }}
                pageData={pageData}
                getPageData={getPageData}
            />

            {stabilityModal &&
                <StabilityPoolModal
                    open={stabilityModal}
                    onClose={() => { setStabilityModal(false); }}
                    pageData={pageData}
                    getPageData={getPageData}
                />
            }

            {
                riskyModal &&
                <RiskyTrovesModal
                    open={riskyModal}
                    onClose={() => { setRiskyModal(false); }}
                    pageData={pageData}
                    getPageData={getPageData}
                />
            }
        </div>
    )
}